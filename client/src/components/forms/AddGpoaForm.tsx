import { Edit, PlusIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { gpoaSchema, GpoaFormValues } from '@/lib/validations/gpoaSchema';
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
import { useState } from 'react';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { gpoaService, Gpoa } from '@/services/gpoa.service';
import DatePicker from '../DatePicker';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type AddGpoaFormProps = {
  mode?: 'add' | 'edit';
  gpoa?: Gpoa;
  trigger?: React.ReactNode;
};

export default function AddGpoaForm({
  gpoa,
  mode = 'add',
  trigger,
}: AddGpoaFormProps) {
  if (gpoa === undefined && mode === 'edit') {
    throw new Error('No GPOA data provided while form mode is on edit');
  }

  const [open, setOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GpoaFormValues>({
    resolver: zodResolver(gpoaSchema),
    defaultValues: gpoa
      ? {
          name: gpoa.name,
          description: gpoa.description,
          venue: gpoa.venue,
          budget: gpoa.budget,
          status: gpoa.status,
          targetDate: new Date(gpoa.targetDate),
        }
      : undefined,
  });

  const onSubmit = async (data: GpoaFormValues) => {
    try {
      const payload = {
        ...data,
        status: data.status || 'upcoming',
        targetDate: data.targetDate.toISOString(),
      };

      if (mode === 'add') {
        await gpoaService.create(payload);
      }
      if (mode === 'edit' && gpoa) {
        await gpoaService.update(gpoa._id, payload);
      }

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GPOA],
      });
      if (mode === 'add') reset();
      setOpen(false);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit form',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : mode === 'add' ? (
          <Button className="flex items-center gap-2 rounded-full" size="sm">
            <PlusIcon className="size-4" />
            <p>Add Plan</p>
          </Button>
        ) : (
          <Button className="flex gap-2 rounded-full" size="sm" variant="ghost">
            <Edit className="size-4" />
            <p>Edit</p>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Plan (GPOA)</DialogTitle>
          <DialogDescription>
            Fill up the form to {mode === 'add' ? 'add a new' : 'edit an'}{' '}
            GPOA plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <InputField<GpoaFormValues>
            name="name"
            registerFn={register}
            errors={errors}
            label="Plan Name:"
            id="name"
          />

          <InputField<GpoaFormValues>
            name="description"
            registerFn={register}
            errors={errors}
            label="Description (optional):"
            id="description"
          />

          <InputField<GpoaFormValues>
            name="venue"
            registerFn={register}
            errors={errors}
            label="Venue:"
            id="venue"
          />
          
          <InputField<GpoaFormValues>
            name="budget"
            type="number"
            registerFn={register}
            errors={errors}
            label="Budget (₱):"
            id="budget"
          />

          <Controller
            control={control}
            name="targetDate"
            render={({ field }) => (
              <DatePicker
                date={field.value}
                setDate={field.onChange}
                error={errors.targetDate?.message?.toString()}
              />
            )}
          />

          {mode === 'edit' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {errors.root && errors.root.message && (
            <ErrorText>{errors.root.message.toString()}</ErrorText>
          )}

          <div className="flex justify-end pt-4">
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
