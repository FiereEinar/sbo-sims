import { fetchEvents } from '@/api/event';
import EventTable from '@/components/event/EventTable';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import AddEventForm from '@/components/forms/AddEventForm';
import SemInput from '@/components/SemInput';
import SchoolYearInput from '@/components/SchoolYearInput';

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
          <AddEventForm />
        </HasPermission>
      </StickyHeader>
      <div className="flex items-end flex-wrap gap-3">
        <SemInput />
        <SchoolYearInput />
      </div>

      <EventTable events={events ?? []} isLoading={eventsLoading} />

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
