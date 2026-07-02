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
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type SortOption =
  | 'none'
  | 'name_asc'
  | 'name_desc'
  | 'date_asc'
  | 'date_desc'
  | 'sessions_asc'
  | 'sessions_desc';

type EventTableProps = {
  events: Event[];
  isLoading: boolean;
};

export default function EventTable({ events, isLoading }: EventTableProps) {
  const navigate = useTenantNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('none');

  const sortedEvents = events
    ? [...events].sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return a.title.localeCompare(b.title);
          case 'name_desc':
            return b.title.localeCompare(a.title);
          case 'date_asc':
            return new Date(a.start).getTime() - new Date(b.start).getTime();
          case 'date_desc':
            return new Date(b.start).getTime() - new Date(a.start).getTime();
          case 'sessions_asc':
            return (a.sessionsCount ?? 0) - (b.sessionsCount ?? 0);
          case 'sessions_desc':
            return (b.sessionsCount ?? 0) - (a.sessionsCount ?? 0);
          default:
            return 0;
        }
      })
    : undefined;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">
            <Select
              value={['name_asc', 'name_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
                <SelectValue placeholder="Event Name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Event Name</SelectItem>
                <SelectItem value="name_asc">Name: A-Z</SelectItem>
                <SelectItem value="name_desc">Name: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
          <TableHead className="w-[200px]">
            <Select
              value={['date_asc', 'date_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
                <SelectValue placeholder="Date & Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Date & Time</SelectItem>
                <SelectItem value="date_asc">Date: Earliest First</SelectItem>
                <SelectItem value="date_desc">Date: Latest First</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
          <TableHead className="w-[300px]">Venue</TableHead>
          <TableHead className="w-[100px]">
            <Select
              value={['sessions_asc', 'sessions_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
                <SelectValue placeholder="Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sessions</SelectItem>
                <SelectItem value="sessions_asc">Sessions: Low to High</SelectItem>
                <SelectItem value="sessions_desc">Sessions: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading && <TableLoading colSpan={4} />}
        {!events?.length && !isLoading && (
          <TableRow>
            <TableCell colSpan={4}>No events</TableCell>
          </TableRow>
        )}
        {sortedEvents &&
          sortedEvents.map((event) => (
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
