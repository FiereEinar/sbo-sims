import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchEvent } from '@/api/event';
import { fetchEventSessions } from '@/api/eventSession';
import { QUERY_KEYS, MODULES } from '@/constants';
import BackButton from '@/components/buttons/BackButton';
import EventDataCard from '@/components/event/EventDataCard';
import EditAndDeleteEventButton from '@/components/buttons/EditAndDeleteEventButton';
import EventSessionCard from '@/components/event/EventSessionCard';
import AddEventSessionForm from '@/components/forms/AddEventSessionForm';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import HasPermission from '@/components/HasPermission';

export default function EventInfo() {
  const { eventID } = useParams();

  const {
    data: event,
    isLoading: isEventLoading,
    error: eventError,
  } = useQuery({
    queryKey: [QUERY_KEYS.EVENT, eventID],
    queryFn: () => fetchEvent(eventID as string),
    enabled: !!eventID,
  });

  const {
    data: sessions,
    isLoading: isSessionsLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.EVENT, eventID, 'sessions'],
    queryFn: () => fetchEventSessions(eventID as string),
    enabled: !!eventID,
  });

  if (eventError) {
    return <p>Session expired or event not found. Please login again.</p>;
  }

  return (
    <SidebarPageLayout>
      <BackButton />

      {isEventLoading && <StickyHeaderLoading />}

      {event && (
        <StickyHeader>
          <EventDataCard event={event} />
          <div className="flex flex-col items-start sm:items-end space-y-2">
            <EditAndDeleteEventButton event={event} />
          </div>
        </StickyHeader>
      )}

      <div className="mt-6 flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Event Sessions</h2>
        {event && (
          <HasPermission permissions={[MODULES.EVENT_CREATE]}>
            <AddEventSessionForm eventId={event._id} mode="add" />
          </HasPermission>
        )}
      </div>

      {isSessionsLoading ? (
        <p className="text-muted-foreground">Loading sessions...</p>
      ) : sessions && sessions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sessions.map((session) => (
            <EventSessionCard key={session._id} session={session} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-accent/20">
          <p className="text-muted-foreground text-center">
            No sessions created yet.<br />
            Create a session to start tracking attendance.
          </p>
        </div>
      )}
    </SidebarPageLayout>
  );
}

