import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { useParams } from 'react-router-dom';

export default function EventInfo() {
  const { eventID } = useParams();

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <Header>Event Info</Header>
      </StickyHeader>
      <div className="mt-4">
        <p>Event ID: {eventID}</p>
        <p className="text-muted-foreground mt-2">
          Event info and session management will be built here.
        </p>
      </div>
    </SidebarPageLayout>
  );
}
