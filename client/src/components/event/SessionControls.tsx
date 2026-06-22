import { EventSession } from '@/types/event';
import { Button } from '../ui/button';
import { Play, Pause, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateEventSessionStatus } from '@/api/eventSession';
import { queryClient } from '@/main';
import { QUERY_KEYS, MODULES } from '@/constants';
import HasPermission from '../HasPermission';

type SessionControlsProps = {
  session: EventSession;
};

export default function SessionControls({ session }: SessionControlsProps) {
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: EventSession['status']) => {
    try {
      await updateEventSessionStatus(session._id, newStatus);
      const eventId = typeof session.event === 'string' ? session.event : (session.event as any)._id;
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT, eventId, 'sessions'],
      });
      toast({
        title: `Session ${newStatus}`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: err.message,
      });
    }
  };

  return (
    <HasPermission permissions={[MODULES.EVENT_UPDATE]}>
      <div className="flex flex-wrap gap-2 items-center">
        {session.status === 'upcoming' || session.status === 'paused' ? (
          <Button
            onClick={() => handleStatusChange('active')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="mr-2 h-4 w-4" /> Start Session
          </Button>
        ) : null}

        {session.status === 'active' ? (
          <Button
            onClick={() => handleStatusChange('paused')}
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50"
          >
            <Pause className="mr-2 h-4 w-4" /> Pause Session
          </Button>
        ) : null}

        {session.status !== 'completed' ? (
          <Button
            onClick={() => handleStatusChange('completed')}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            <CheckSquare className="mr-2 h-4 w-4" /> Complete Session
          </Button>
        ) : null}
      </div>
    </HasPermission>
  );
}
