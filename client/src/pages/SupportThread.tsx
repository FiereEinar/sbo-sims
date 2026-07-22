import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { getOrgSupportTicket, replyToOrgTicket } from '@/api/support-ticket';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { ChevronLeft } from 'lucide-react';
import { useUserStore } from '@/store/user';

export default function SupportThread() {
  const { ticketID } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.SUPPORT_TICKETS, ticketID],
    queryFn: () => getOrgSupportTicket(ticketID!),
    enabled: !!ticketID,
    throwOnError: false,
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setIsSubmitting(true);
      await replyToOrgTicket(ticketID!, replyMessage);
      setReplyMessage('');
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SUPPORT_TICKETS, ticketID],
      });
      toast({ title: 'Reply sent successfully' });
    } catch (err: any) {
      toast({
        title: 'Error sending reply',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarPageLayout>
        <p className="p-5">Loading ticket...</p>
      </SidebarPageLayout>
    );
  }

  if (isError || !ticket) {
    return (
      <SidebarPageLayout>
        <p className="p-5 text-red-500">Failed to load ticket. It may not exist or you may not have access.</p>
      </SidebarPageLayout>
    );
  }

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Header>Ticket: {ticket.title}</Header>
        </div>
        <Badge variant="outline">{ticket.status}</Badge>
      </StickyHeader>

      <div className="max-w-3xl mx-auto mt-6 space-y-6 pb-20">
        {/* Original Ticket */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {ticket.submittedBy?.firstname?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {ticket.submittedBy?.firstname} {ticket.submittedBy?.lastname}
                </p>
                <p className="text-xs text-muted-foreground">Original Post</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <div className="text-sm whitespace-pre-wrap">{ticket.description}</div>
        </div>

        {/* Replies */}
        {ticket.replies?.map((reply) => {
          const isMe = reply.sender._id === user?._id;
          return (
            <div key={reply._id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {reply.sender.firstname?.[0] ?? '?'}
              </div>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {reply.sender.firstname} {reply.sender.lastname}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border rounded-tl-sm'}`}>
                  {reply.message}
                </div>
              </div>
            </div>
          );
        })}

        {/* Reply Box */}
        <form onSubmit={handleReply} className="bg-card border rounded-2xl p-4 flex gap-3 items-end">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply..."
            rows={2}
            className="flex-1 min-h-[60px] bg-transparent border-0 focus-visible:ring-0 resize-none text-sm p-2"
          />
          <Button type="submit" disabled={isSubmitting || !replyMessage.trim()} size="sm" className="rounded-full px-6">
            Send
          </Button>
        </form>
      </div>
    </SidebarPageLayout>
  );
}
