import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { getAdminSupportTicket, replyToAdminTicket, updateAdminSupportTicketStatus } from '@/api/support-ticket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { ChevronLeft } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminSupportThread() {
  const { ticketID } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: [QUERY_KEYS.SUPPORT_TICKETS, 'admin', ticketID],
    queryFn: () => getAdminSupportTicket(ticketID!),
    enabled: !!ticketID,
    throwOnError: false,
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    try {
      setIsSubmitting(true);
      await replyToAdminTicket(ticketID!, replyMessage);
      setReplyMessage('');
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SUPPORT_TICKETS, 'admin', ticketID],
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateAdminSupportTicketStatus(ticketID!, newStatus);
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SUPPORT_TICKETS, 'admin', ticketID],
      });
      toast({ title: 'Status Updated' });
    } catch (err) {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-white">Loading ticket...</div>;
  }

  if (isError || !ticket) {
    return <div className="p-8 text-red-400">Failed to load ticket. It may not exist or you may not have access.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full text-white hover:bg-white/10">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{ticket.title}</h1>
            <p className="text-sm text-white/50">{ticket.organization?.name || 'Unknown Org'}</p>
          </div>
        </div>
        <Select value={ticket.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px] border-white/20 bg-white/5 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto space-y-6 pb-6 pr-2">
        {/* Original Ticket */}
        <div className="bg-[#1a1a2e]/60 border border-white/10 rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                {ticket.submittedBy?.firstname?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {ticket.submittedBy?.firstname} {ticket.submittedBy?.lastname}
                </p>
                <p className="text-xs text-white/50">{ticket.submittedBy?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-white/60 border-white/20 mb-1">{ticket.type}</Badge>
              <p className="text-[10px] text-white/40">
                {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-sm text-white/90 whitespace-pre-wrap">{ticket.description}</div>
        </div>

        {/* Replies */}
        {ticket.replies?.map((reply) => {
          const isMe = reply.sender._id === user?._id;
          return (
            <div key={reply._id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${isMe ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60'}`}>
                {reply.sender.firstname?.[0] ?? '?'}
              </div>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium text-white/80">
                    {reply.sender.firstname} {reply.sender.lastname}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${isMe ? 'bg-purple-500/20 text-purple-100 border border-purple-500/30 rounded-tr-sm' : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-sm'}`}>
                  {reply.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Box */}
      <form onSubmit={handleReply} className="bg-[#1a1a2e]/80 border border-white/10 rounded-2xl p-3 flex gap-3 items-end shrink-0 mt-4 backdrop-blur-xl">
        <textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          placeholder="Type your reply to the organization..."
          rows={2}
          className="flex-1 min-h-[60px] bg-transparent border-0 focus-visible:ring-0 resize-none text-sm p-2 text-white placeholder:text-white/30"
        />
        <Button type="submit" disabled={isSubmitting || !replyMessage.trim()} size="sm" className="rounded-full px-6 bg-purple-600 hover:bg-purple-700 text-white">
          Send Reply
        </Button>
      </form>
    </div>
  );
}
