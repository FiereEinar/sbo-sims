import { AlertCircle, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStudentDashboard } from '@/api/student-portal';
import {
  createPaymentRequest,
  fetchCategoriesForOrg,
} from '@/api/payment-request';

export default function NewPaymentRequestForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState<'cash' | 'gcash'>('gcash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isUploadDisabled = import.meta.env.PROD;

  // Fetch student dashboard for enrolled orgs
  const { data: dashboardData } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: fetchStudentDashboard,
  });

  const enrolledOrgs = Array.from(
    new Map(
      (dashboardData?.enrolledOrgs || [])
        .filter(Boolean)
        .map((org: any) => [org._id, org]),
    ).values(),
  );

  // Fetch categories for selected org
  const { data: categories } = useQuery({
    queryKey: ['categories', selectedOrg],
    queryFn: () => {
      const org = enrolledOrgs.find((o: any) => o._id === selectedOrg);
      return org ? fetchCategoriesForOrg((org as any).slug) : [];
    },
    enabled: !!selectedOrg,
  });

  const submitMutation = useMutation({
    mutationFn: createPaymentRequest,
    onSuccess: () => {
      toast({
        title: 'Payment Request Submitted',
        description: 'Your request is now pending approval.',
      });
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['student-payment-requests'] });
      // Reset form
      setSelectedOrg('');
      setSelectedCategory('');
      setAmount('');
      setReferenceNumber('');
      setFile(null);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to submit request',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !selectedCategory || !amount) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all required fields',
      });
      return;
    }
    const formData = new FormData();
    formData.append('organization', selectedOrg);
    formData.append('category', selectedCategory);
    formData.append('amount', amount);
    formData.append('modeOfPayment', modeOfPayment);
    if (referenceNumber) formData.append('referenceNumber', referenceNumber);
    if (file) formData.append('receiptImage', file);

    submitMutation.mutate(formData);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex justify-center gap-2 rounded-full">
          <Plus className="size-4" /> New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Payment Request</DialogTitle>
          <DialogDescription>
            Fill up the form to submit your proof of payment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {isUploadDisabled && (
            <AlertDialog>
              <div className="flex gap-2 items-center">
                <AlertCircle className="h-4 w-4 text-blue-800" />
                <AlertDialogTitle>Notice</AlertDialogTitle>
              </div>
              <AlertDialogDescription>
                Image uploads are currently disabled due to server constraints.
                Please provide your Reference Number instead.
              </AlertDialogDescription>
            </AlertDialog>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Organization *</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select Organization" />
              </SelectTrigger>
              <SelectContent>
                {enrolledOrgs.map((org: any) => (
                  <SelectItem key={org._id} value={org._id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Category *</Label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                const cat = categories?.find((c) => c._id === val);
                if (cat) setAmount(cat.fee.toString());
              }}
              disabled={!selectedOrg}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category/Fee" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name} (₱{cat.fee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Mode of Payment *</Label>
            <Select
              value={modeOfPayment}
              onValueChange={(val: 'cash' | 'gcash') => setModeOfPayment(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Mode of Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Reference Number</Label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. 1029384756"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Receipt Image</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={isUploadDisabled}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
