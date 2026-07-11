import { useQuery } from '@tanstack/react-query';
import { fetchStudentPaymentRequests } from '@/api/payment-request';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

import NewPaymentRequestForm from '@/components/forms/NewPaymentRequestForm';

export default function StudentPaymentRequests() {
  // Fetch student payment requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['student-payment-requests'],
    queryFn: fetchStudentPaymentRequests,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit proofs of payment for admin approval.
          </p>
        </div>

        <NewPaymentRequestForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          ) : requests?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-4 text-muted-foreground"
              >
                No payment requests found.
              </TableCell>
            </TableRow>
          ) : (
            requests?.map((req) => (
              <TableRow key={req._id}>
                <TableCell>
                  {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>{(req.organization as any)?.name}</TableCell>
                <TableCell>{(req.category as any)?.name}</TableCell>
                <TableCell>₱{req.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {req.status === 'approved' ? (
                    <p className="text-green-500 font-medium">Approved</p>
                  ) : req.status === 'rejected' ? (
                    <p className="text-red-500 font-medium">Rejected</p>
                  ) : (
                    <p className="text-yellow-500 font-medium">Pending</p>
                  )}
                  {req.remarks && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Reason: {req.remarks}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
