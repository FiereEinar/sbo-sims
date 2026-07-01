import { useState } from 'react';
import { EventSession } from '@/types/event';
import { Button } from '../ui/button';
import { Play, Pause, CheckSquare, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: EventSession['status']) => {
    try {
      setLoading(true);
      await updateEventSessionStatus(session._id, newStatus);
      const eventId =
        typeof session.event === 'string'
          ? session.event
          : (session.event as any)._id;
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <HasPermission permissions={[MODULES.EVENT_UPDATE]}>
      <div className="flex flex-wrap gap-2 items-center">
        {session.status === 'upcoming' || session.status === 'paused' ? (
          <Button
            onClick={() => handleStatusChange('active')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white rounded-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}{' '}
            Start Session
          </Button>
        ) : null}

        {session.status === 'active' ? (
          <Button
            onClick={() => handleStatusChange('paused')}
            disabled={loading}
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}{' '}
            Pause Session
          </Button>
        ) : null}

        {session.status !== 'completed' ? (
          <Button
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-50 rounded-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckSquare className="mr-2 h-4 w-4" />
            )}{' '}
            Complete Session
          </Button>
        ) : null}
      </div>
    </HasPermission>
  );
}
