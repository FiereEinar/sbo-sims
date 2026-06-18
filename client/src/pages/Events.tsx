import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/header';
import { MODULES } from '@/constants';
import { Plus } from 'lucide-react';

export default function Events() {
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
