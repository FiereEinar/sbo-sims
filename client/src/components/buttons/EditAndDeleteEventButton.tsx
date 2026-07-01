import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { queryClient } from '@/main';
import { MODULES, QUERY_KEYS } from '@/constants';
import { Event } from '@/types/event';
import AddEventForm from '../forms/AddEventForm';
import { requestDeleteEvent } from '@/api/event';
import HasPermission from '../HasPermission';

type EditAndDeleteEventButtonProps = {
  event: Event;
};

export default function EditAndDeleteEventButton({
  event,
}: EditAndDeleteEventButtonProps) {
  return (
    <div className="space-x-2 flex">
      <HasPermission permissions={[MODULES.EVENT_UPDATE]}>
        <EditButton event={event} />
      </HasPermission>

      <HasPermission permissions={[MODULES.EVENT_DELETE]}>
        <DeleteButton eventID={event._id} />
      </HasPermission>
    </div>
  );
}

type DeleteButtonProps = {
  eventID: string;
};

function DeleteButton({ eventID }: DeleteButtonProps) {
  const { toast } = useToast();
  const navigate = useTenantNavigate();

  const onDelete = async () => {
    try {
      navigate('/events');

      await requestDeleteEvent(eventID);
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT],
      });
    } catch (err: any) {
      console.error('Failed to delete event', err);
      toast({
        variant: 'destructive',
        title: 'Failed to delete event',
        description:
          err.message || 'A network error occured while trying to delete event',
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="flex gap-2 items-center rounded-full"
          variant="destructive"
          size="sm"
        >
          <Trash2 className="size-4" />
          <p>Delete</p>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently archive the
            event.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditButton({ event }: EditAndDeleteEventButtonProps) {
  return <AddEventForm mode="edit" event={event} />;
}
