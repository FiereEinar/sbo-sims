import { format } from 'date-fns';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

type DateTimePickerProps = {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  error?: string;
  label?: string;
};

export default function DateTimePicker({
  date,
  setDate,
  error,
  label,
}: DateTimePickerProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!date) return;
    const time = e.target.value;
    if (!time) return;
    const [hours, minutes] = time.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    setDate(newDate);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }
    // preserve time if date exists
    if (date) {
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
    } else {
      // default time to 00:00 or current time
      newDate.setHours(0);
      newDate.setMinutes(0);
    }
    setDate(newDate);
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-muted-foreground">{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP p') : <span>Pick a date and time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
          />
          <div className="p-3 border-t border-border">
            <Label className="mb-2 block text-xs">Time</Label>
            <Input
              type="time"
              value={date ? format(date, 'HH:mm') : ''}
              onChange={handleTimeChange}
              disabled={!date}
            />
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
