import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { createSupportTicket } from '@/api/support-ticket';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '../InputField';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import ErrorText from '../ui/error-text';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const supportTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Type is required'),
  customType: z.string().optional(),
});

type FormValues = z.infer<typeof supportTicketSchema>;

export default function SupportTicketForm() {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('SUGGESTION');

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { type: 'BUG' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const type = data.type === 'OTHER' ? data.customType : data.type;
      if (data.type === 'OTHER' && !data.customType) {
        setError('customType', { message: 'Please specify the type' });
        return;
      }

      await createSupportTicket({
        title: data.title,
        description: data.description,
        type: type || 'OTHER',
      });

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SUPPORT_TICKETS],
      });
      reset();
      setSelectedType('BUG');
      setOpen(false);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit ticket',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex gap-2 items-center rounded-full" size="sm">
          <PlusIcon className="size-4" />
          <p>New Ticket</p>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Support Ticket</DialogTitle>
          <DialogDescription>
            Submit a bug report or suggestion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <InputField<FormValues>
            name="title"
            registerFn={register}
            errors={errors}
            label="Title:"
            placeholder="Brief summary..."
            id="title"
          />

          <div className="space-y-1">
            <label className="text-sm font-medium">Type:</label>
            <Select
              value={selectedType}
              onValueChange={(val) => {
                setSelectedType(val);
                setValue('type', val);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUGGESTION">Suggestion</SelectItem>
                <SelectItem value="BUG">Bug Report</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <ErrorText>{errors.type.message}</ErrorText>}
          </div>

          {selectedType === 'OTHER' && (
            <InputField<FormValues>
              name="customType"
              registerFn={register}
              errors={errors}
              label="Specify Type:"
              placeholder="Custom type..."
              id="customType"
            />
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Description:</label>
            <textarea
              {...register('description')}
              placeholder="Detailed explanation..."
              rows={4}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && (
              <ErrorText>{errors.description.message}</ErrorText>
            )}
          </div>

          {errors.root && errors.root.message && (
            <ErrorText>{errors.root.message.toString()}</ErrorText>
          )}

          <div className="flex justify-end pt-2">
            <Button disabled={isSubmitting} type="submit">
              Submit
            </Button>
          </div>
        </form>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
