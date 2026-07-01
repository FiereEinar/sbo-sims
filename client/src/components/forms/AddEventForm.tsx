import { Edit, PlusIcon } from 'lucide-react';
import { submitEventForm, submitUpdateEventForm } from '@/api/event';
import { eventSchema } from '@/lib/validations/eventSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import InputField from '../InputField';
import DateTimePicker from '../DateTimePicker';
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
import { Event } from '@/types/event';

export type EventFormValues = z.infer<typeof eventSchema>;

type AddEventFormProps = {
  mode?: 'add' | 'edit';
  event?: Event;
};

export default function AddEventForm({
  event,
  mode = 'add',
}: AddEventFormProps) {
  if (event === undefined && mode === 'edit') {
    throw new Error('No event data provided while event form mode is on edit');
  }

  const [open, setOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          venue: event.venue,
          start: new Date(event.start),
          end: new Date(event.end),
        }
      : undefined,
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      if (mode === 'add') {
        await submitEventForm(data);
      }
      if (mode === 'edit' && event) {
        await submitUpdateEventForm(event._id, data);
      }

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT],
      });
      reset();
      setOpen(false);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit event form',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="flex items-center gap-2 rounded-full" size="sm">
            <PlusIcon className="size-4" />
            <p>Add Event</p>
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
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Event</DialogTitle>
          <DialogDescription>
            Fill up the form to {mode === 'add' ? 'add a new' : 'edit an'}{' '}
            event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <InputField<EventFormValues>
            name="title"
            registerFn={register}
            errors={errors}
            label="Event title:"
            id="title"
          />

          <InputField<EventFormValues>
            name="description"
            registerFn={register}
            errors={errors}
            label="Description:"
            id="description"
          />

          <InputField<EventFormValues>
            name="venue"
            registerFn={register}
            errors={errors}
            label="Venue:"
            id="venue"
          />

          <Controller
            control={control}
            name="start"
            render={({ field }) => (
              <DateTimePicker
                label="Start Date & Time:"
                date={field.value}
                setDate={field.onChange}
                error={errors.start?.message?.toString()}
              />
            )}
          />

          <Controller
            control={control}
            name="end"
            render={({ field }) => (
              <DateTimePicker
                label="End Date & Time:"
                date={field.value}
                setDate={field.onChange}
                error={errors.end?.message?.toString()}
              />
            )}
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
