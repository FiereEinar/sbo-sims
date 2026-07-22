import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '@/constants';
import { getAdminSupportTickets } from '@/api/support-ticket';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminSupport() {
  const navigate = useNavigate();
  const { data: tickets, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SUPPORT_TICKETS, 'admin'],
    queryFn: getAdminSupportTickets,
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'RESOLVED': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'CLOSED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Support Tickets</h1>
      <p className="text-sm text-white/40 mb-6">Click a row to view the thread and reply</p>

      <div className="bg-[#1a1a2e]/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Ticket</TableHead>
              <TableHead className="text-white/60">Organization</TableHead>
              <TableHead className="text-white/60">Type</TableHead>
              <TableHead className="text-white/60">Submitted By</TableHead>
              <TableHead className="text-white/60">Date</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableCell colSpan={6} className="text-center text-white/60 py-8">Loading...</TableCell>
              </TableRow>
            ) : tickets?.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableCell colSpan={6} className="text-center text-white/60 py-8">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              tickets?.map((ticket) => (
                <TableRow 
                  key={ticket._id} 
                  className="border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/support/${ticket._id}`)}
                >
                  <TableCell className="font-medium text-white max-w-[300px]">
                    <div className="truncate">{ticket.title}</div>
                    <div className="text-xs text-white/40 truncate mt-1" title={ticket.description}>
                      {ticket.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/80">
                    {ticket.organization?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-white/60 border-white/20">{ticket.type}</Badge>
                  </TableCell>
                  <TableCell className="text-white/80">
                    {ticket.submittedBy?.firstname} {ticket.submittedBy?.lastname}
                    <div className="text-xs text-white/40">{ticket.submittedBy?.email}</div>
                  </TableCell>
                  <TableCell className="text-white/80">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(ticket.status)} border text-xs`}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
