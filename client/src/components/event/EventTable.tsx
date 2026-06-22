import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  Table,
} from '../ui/table';
import TableLoading from '../loading/TableLoading';
import { Event } from '../../types/event';
import { format } from 'date-fns';

type EventTableProps = {
  events: Event[];
  isLoading: boolean;
};

export default function EventTable({ events, isLoading }: EventTableProps) {
  const navigate = useTenantNavigate();
  console.log(events);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Event Name</TableHead>
          <TableHead className="w-[200px]">Date & Time</TableHead>
          <TableHead className="w-[300px]">Venue</TableHead>
          <TableHead className="w-[100px]">Sessions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading && <TableLoading colSpan={4} />}
        {!events?.length && !isLoading && (
          <TableRow>
            <TableCell colSpan={4}>No events</TableCell>
          </TableRow>
        )}
        {events &&
          events.map((event) => (
            <TableRow
              className="cursor-pointer"
              onClick={() => navigate(`/event/${event._id}`)}
              key={event._id}
            >
              <TableCell className="">{event.title}</TableCell>
              <TableCell className="">
                <p className="font-medium">
                  {format(new Date(event.start), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.start), 'h:mm a')}
                </p>
              </TableCell>
              <TableCell className="">{event.venue}</TableCell>
              <TableCell className="">{event.sessionsCount ?? 0}</TableCell>
            </TableRow>
          ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">{events.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
