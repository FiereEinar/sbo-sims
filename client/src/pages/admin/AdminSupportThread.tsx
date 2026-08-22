import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import {
  getAdminSupportTicket,
  replyToAdminTicket,
  updateAdminSupportTicketStatus,
} from '@/api/support-ticket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { ChevronLeft } from 'lucide-react';
import { useUserStore } from '@/store/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function AdminSupportThread() {
  const { ticketID } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: ticket,
    isLoading,
    isError,
  } = useQuery({
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
    } catch {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground">Loading ticket...</div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-8 text-destructive">
        Failed to load ticket. It may not exist or you may not have access.
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-dvh flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {ticket.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {ticket.organization?.name || 'Unknown Org'}
            </p>
          </div>
        </div>
        <Select value={ticket.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
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
        <div className="bg-card/40 border border-border/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {ticket.submittedBy?.firstname?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {ticket.submittedBy?.firstname} {ticket.submittedBy?.lastname}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticket.submittedBy?.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                {ticket.type}
              </Badge>
              <p className="text-[10px] text-muted-foreground">
                {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          <div className="text-sm text-foreground/90 whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* Replies */}
        {ticket.replies?.map((reply) => {
          const isMe = reply.sender._id === user?._id;
          return (
            <div
              key={reply._id}
              className={cn('flex gap-3', isMe && 'flex-row-reverse')}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs',
                  isMe
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {reply.sender.firstname?.[0] ?? '?'}
              </div>
              <div
                className={cn(
                  'flex flex-col max-w-[80%]',
                  isMe ? 'items-end' : 'items-start',
                )}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {reply.sender.firstname} {reply.sender.lastname}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(reply.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap border',
                    isMe
                      ? 'bg-primary/10 text-primary border-primary/20 rounded-tr-sm'
                      : 'bg-muted text-foreground border-border rounded-tl-sm',
                  )}
                >
                  {reply.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Box */}
      <form
        onSubmit={handleReply}
        className="bg-card/40 border border-border/50 rounded-2xl p-3 flex gap-3 items-end shrink-0 mt-4"
      >
        <textarea
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          placeholder="Type your reply to the organization..."
          rows={2}
          className="flex-1 min-h-[60px] bg-transparent border-0 focus-visible:ring-0 resize-none text-sm p-2 text-foreground placeholder:text-muted-foreground outline-none"
        />
        <Button
          type="submit"
          disabled={isSubmitting || !replyMessage.trim()}
          className="rounded-full px-6"
        >
          Send Reply
        </Button>
      </form>
    </div>
  );
}
