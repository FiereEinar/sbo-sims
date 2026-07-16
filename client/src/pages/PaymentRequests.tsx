import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrgPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from '@/api/payment-request';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import SemInput from '@/components/SemInput';
import SchoolYearInput from '@/components/SchoolYearInput';
import { useUserStore } from '@/store/user';
import HasPermission from '@/components/HasPermission';
import { MODULES } from '@/constants';

export default function AdminPaymentRequests() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUserStore((state) => state);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['org-payment-requests', orgSlug, user?.activeSemDB, user?.activeSchoolYearDB],
    queryFn: () => fetchOrgPaymentRequests(orgSlug!),
    enabled: !!orgSlug,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePaymentRequest(orgSlug!, id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payment request approved.' });
      queryClient.invalidateQueries({
        queryKey: ['org-payment-requests', orgSlug],
      });
      setSelectedRequest(null);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to approve request',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      rejectPaymentRequest(orgSlug!, id, rejectRemarks),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payment request rejected.' });
      queryClient.invalidateQueries({
        queryKey: ['org-payment-requests', orgSlug],
      });
      setSelectedRequest(null);
      setRejectRemarks('');
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to reject request',
      });
    },
  });

  const API_URL = import.meta.env.VITE_API_URL;

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <Header>Payment Requests</Header>
        <div className="flex gap-2 items-center">
          <div className="w-[130px]">
            <SemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <SchoolYearInput hideLabel />
          </div>
        </div>
      </StickyHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          ) : requests?.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-4 text-muted-foreground"
              >
                No payment requests found.
              </TableCell>
            </TableRow>
          ) : (
            requests?.map((req) => (
              <TableRow
                key={req._id}
                className="cursor-pointer"
                onClick={() => setSelectedRequest(req)}
              >
                <TableCell>
                  {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  {typeof req.student !== 'string' && (
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {req.student.firstname} {req.student.lastname}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {req.student.studentID}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {typeof req.category !== 'string' && req.category.name}
                </TableCell>
                <TableCell>₱{req.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {req.status === 'approved' ? (
                    <p className="text-green-500 font-medium">Approved</p>
                  ) : req.status === 'rejected' ? (
                    <p className="text-red-500 font-medium">Rejected</p>
                  ) : (
                    <p className="text-yellow-500 font-medium">Pending</p>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedRequest && (
        <Dialog
          open={!!selectedRequest}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRequest(null);
              setRejectRemarks('');
            }
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Payment Request Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Student:</span>
                  <p className="font-medium">
                    {selectedRequest.student.firstname}{' '}
                    {selectedRequest.student.lastname} (
                    {selectedRequest.student.studentID})
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{selectedRequest.category.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-medium">
                    ₱{selectedRequest.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Mode of Payment:
                  </span>
                  <p className="font-medium uppercase">
                    {selectedRequest.modeOfPayment}
                  </p>
                </div>
                {selectedRequest.referenceNumber && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">
                      Reference Number:
                    </span>
                    <p className="font-medium">
                      {selectedRequest.referenceNumber}
                    </p>
                  </div>
                )}
              </div>

              {selectedRequest.receiptImage && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">
                    Receipt Image:
                  </span>
                  <div className="border rounded-md overflow-hidden bg-muted/30">
                    <img
                      src={API_URL + selectedRequest.receiptImage}
                      alt="Receipt"
                      className="w-full object-contain max-h-[300px]"
                    />
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <HasPermission permissions={[MODULES.PAYMENT_REQUEST_UPDATE]}>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Reject Remarks (Optional)</Label>
                      <Input
                        placeholder="Reason for rejection"
                        value={rejectRemarks}
                        onChange={(e) => setRejectRemarks(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate(selectedRequest._id)}
                        disabled={
                          rejectMutation.isPending || approveMutation.isPending
                        }
                      >
                        {rejectMutation.isPending
                          ? 'Rejecting...'
                          : 'Reject Request'}
                      </Button>
                      <Button
                        onClick={() =>
                          approveMutation.mutate(selectedRequest._id)
                        }
                        disabled={
                          rejectMutation.isPending || approveMutation.isPending
                        }
                      >
                        {approveMutation.isPending
                          ? 'Approving...'
                          : 'Approve Request'}
                      </Button>
                    </div>
                  </div>
                </HasPermission>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="pt-4 border-t text-sm">
                  <p>
                    This request has already been{' '}
                    <strong>{selectedRequest.status}</strong>.
                  </p>
                  {selectedRequest.remarks && (
                    <p className="text-muted-foreground mt-1">
                      Remarks: {selectedRequest.remarks}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SidebarPageLayout>
  );
}
