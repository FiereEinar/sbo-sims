import { Pencil, PlusIcon } from 'lucide-react';
import {
  submitEventSessionForm,
  submitUpdateEventSessionForm,
} from '@/api/eventSession';
import { eventSessionSchema } from '@/lib/validations/eventSessionSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { EventSession } from '@/types/event';

export type EventSessionFormValues = z.infer<typeof eventSessionSchema>;

type AddEventSessionFormProps = {
  mode?: 'add' | 'edit';
  eventId?: string;
  session?: EventSession;
};

export default function AddEventSessionForm({
  session,
  eventId,
  mode = 'add',
}: AddEventSessionFormProps) {
  if (session === undefined && mode === 'edit') {
    throw new Error(
      'No session data provided while session form mode is on edit',
    );
  }

  if (eventId === undefined && mode === 'add') {
    throw new Error('Event ID is required to add a session');
  }

  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventSessionFormValues>({
    resolver: zodResolver(eventSessionSchema),
    defaultValues: session
      ? {
          name: session.name,
        }
      : undefined,
  });

  const onSubmit = async (data: EventSessionFormValues) => {
    try {
      if (mode === 'add' && eventId) {
        await submitEventSessionForm(eventId, data);
      }
      if (mode === 'edit' && session) {
        await submitUpdateEventSessionForm(session._id, data);
      }

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT], // Invalidating entire event queries to be safe and refresh session list
      });
      reset();
      setOpen(false);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit event session form',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="flex items-center gap-2 rounded-full" size="sm">
            <PlusIcon className="size-4" />
            <p>Add Session</p>
          </Button>
        ) : (
          <Button
            className="w-full justify-start font-normal flex gap-2 h-9 px-2"
            variant="ghost"
          >
            <Pencil className="size-4 text-muted-foreground" />
            <p>Edit</p>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Session</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Create a new' : 'Edit the'} session for this
            event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <InputField<EventSessionFormValues>
            name="name"
            registerFn={register}
            errors={errors}
            label="Session Name:"
            id="name"
            placeholder="e.g., Morning Session, Registration, Opening Remarks"
          />

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
