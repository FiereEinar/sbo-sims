import SidebarPageLayout from '@/components/SidebarPageLayout';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { getOrgSupportTickets } from '@/api/support-ticket';
import SupportTicketForm from '@/components/forms/SupportTicketForm';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';

export default function Support() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SUPPORT_TICKETS],
    queryFn: getOrgSupportTickets,
  });
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500';
      case 'RESOLVED':
        return 'bg-green-500/10 text-green-500';
      case 'CLOSED':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <div className="space-y-2">
          <Header>Support Tickets</Header>
          <p className="text-sm text-muted-foreground">
            Submit and view support tickets.
          </p>
        </div>
        <SupportTicketForm />
      </StickyHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : tickets?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No tickets found
              </TableCell>
            </TableRow>
          ) : (
            tickets?.map((ticket) => (
              <TableRow
                key={ticket._id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/${orgSlug}/support/${ticket._id}`)}
              >
                <TableCell className="font-medium">
                  {ticket.title}
                  <p className="text-xs text-muted-foreground truncate max-w-sm mt-1">
                    {ticket.description}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ticket.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={getStatusColor(ticket.status)}
                    variant="secondary"
                  >
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ticket.submittedBy?.firstname} {ticket.submittedBy?.lastname}
                </TableCell>
                <TableCell>
                  {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </SidebarPageLayout>
  );
}
