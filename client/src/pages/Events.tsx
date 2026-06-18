import { fetchEvents } from '@/api/event';
import EventTable from '@/components/event/EventTable';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

export default function Events() {
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: [QUERY_KEYS.EVENT],
    queryFn: fetchEvents,
  });

  if (eventsError) {
    return <p>Session expired, login again.</p>;
  }

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <Header>Events</Header>

        <HasPermission permissions={[MODULES.EVENT_CREATE]}>
          {/* create AddEventForm in /components/forms in the future */}
          <Button className="flex justify-center gap-1" size="sm">
            <Plus />
            <p>Add Event</p>
          </Button>
        </HasPermission>
      </StickyHeader>
      <div className="flex justify-between items-end flex-wrap gap-3">
        {/* <EventFilter /> */}
      </div>

      <EventTable
        events={events ?? []}
        eventSessions={[]}
        isLoading={eventsLoading}
      />

      {/* {studentsFetchResult && (
        <PaginationController
          currentPage={page ?? 1}
          nextPage={studentsFetchResult.next}
          prevPage={studentsFetchResult.prev}
          setPage={setPage}
          prefetchFn={prefetchPageFn}
        />
      )} */}
    </SidebarPageLayout>
  );
}
