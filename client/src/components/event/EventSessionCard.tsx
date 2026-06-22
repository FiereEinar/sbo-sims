import { useState } from 'react';
import { EventSession } from '@/types/event';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  PlayCircle,
  PauseCircle,
  CheckCircle,
  Clock,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTenantNavigate } from '@/hooks/useTenantNavigate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import AddEventSessionForm from '../forms/AddEventSessionForm';
import { requestDeleteEventSession } from '@/api/eventSession';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { QUERY_KEYS, MODULES } from '@/constants';
import HasPermission from '../HasPermission';
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
} from '../ui/alert-dialog';

type EventSessionCardProps = {
  session: EventSession;
};

export default function EventSessionCard({ session }: EventSessionCardProps) {
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const getStatusIcon = (status: EventSession['status']) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="size-4 text-green-500" />;
      case 'paused':
        return <PauseCircle className="size-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="size-4 text-blue-500" />;
      case 'upcoming':
      default:
        return <Clock className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: EventSession['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'upcoming':
      default:
        return 'secondary';
    }
  };

  const handleDelete = async () => {
    try {
      await requestDeleteEventSession(session._id);
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT],
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete session',
        description: err.message,
      });
    }
  };

  const navigate = useTenantNavigate();

  return (
    <Card
      className="flex flex-col border shadow-sm bg-card/50 hover:border-primary/50 cursor-pointer transition-colors"
      onClick={() =>
        navigate(`/event/${session.event._id}/session/${session._id}`)
      }
    >
      <CardContent className="p-4 flex flex-col h-full gap-2 relative">
        <div className="absolute top-4 right-4">
          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <HasPermission permissions={[MODULES.EVENT_UPDATE]}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <AddEventSessionForm mode="edit" session={session} />
                  </div>
                </HasPermission>
                <HasPermission permissions={[MODULES.EVENT_DELETE]}>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full justify-start font-normal flex gap-2 h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      variant="ghost"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="size-4" />
                      <p>Delete</p>
                    </Button>
                  </AlertDialogTrigger>
                </HasPermission>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  event session.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex gap-2 items-center mr-6">
          {getStatusIcon(session.status)}
          <h3
            className="font-semibold text-lg line-clamp-1"
            title={session.name}
          >
            {session.name}
          </h3>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant={getStatusBadgeVariant(session.status)}
            className="capitalize"
          >
            {session.status}
          </Badge>
        </div>

        <div className="mt-auto pt-4 text-xs text-muted-foreground">
          {session.startedAt ? (
            <p>Started: {format(new Date(session.startedAt), 'h:mm a')}</p>
          ) : (
            <p>Not started yet</p>
          )}
          {session.endedAt && (
            <p>Ended: {format(new Date(session.endedAt), 'h:mm a')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
