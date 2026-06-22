import { Event } from '@/types/event';
import { MapPin, Calendar, Clock, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';
import Header from '../ui/header';

type EventDataCardProps = {
  event: Event;
};

export default function EventDataCard({ event }: EventDataCardProps) {
  return (
    <div className="space-y-2">
      {/* Context */}
      <p className="text-xs text-muted-foreground">Viewing event details</p>

      <Header size="md">{event.title}</Header>

      <div className="flex gap-5 text-sm text-muted-foreground items-center">
        <div className="flex gap-2 text-sm text-muted-foreground items-center">
          <MapPin className="size-4 shrink-0" />
          <p>{event.venue}</p>
        </div>

        <div className="flex gap-2 text-sm text-muted-foreground items-center">
          <Calendar className="size-4 shrink-0" />
          <p>{format(new Date(event.start), 'MMMM d, yyyy')}</p>
        </div>

        <div className="flex gap-2 text-sm text-muted-foreground items-center">
          <Clock className="size-4 shrink-0" />
          <p>
            {format(new Date(event.start), 'h:mm a')} -{' '}
            {format(new Date(event.end), 'h:mm a')}
          </p>
        </div>
      </div>

      <div className="flex gap-2 text-sm text-muted-foreground items-start">
        <AlignLeft className="size-4 mt-0.5 shrink-0" />
        <p>{event.description}</p>
      </div>
    </div>
  );
}
