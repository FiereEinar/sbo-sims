import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '@/constants';
import { getAdminSupportTickets } from '@/api/support-ticket';
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

export default function AdminSupport() {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SUPPORT_TICKETS, 'admin'],
    queryFn: getAdminSupportTickets,
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'CLOSED':
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default:
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <div className="p-6 md:p-8 min-h-full">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          Support Tickets
        </h1>
        <p className="text-sm text-muted-foreground">
          Click a row to view the thread and reply
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : tickets?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                No tickets found
              </TableCell>
            </TableRow>
          ) : (
            tickets?.map((ticket) => (
              <TableRow
                key={ticket._id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/support/${ticket._id}`)}
              >
                <TableCell className="font-medium max-w-[300px]">
                  <div className="truncate">{ticket.title}</div>
                  <div
                    className="text-xs text-muted-foreground truncate mt-0.5"
                    title={ticket.description}
                  >
                    {ticket.description}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {ticket.organization?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ticket.type}</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {ticket.submittedBy?.firstname}{' '}
                    {ticket.submittedBy?.lastname}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {ticket.submittedBy?.email}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusClass(ticket.status)} border text-xs`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
