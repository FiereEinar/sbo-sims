import { format } from 'date-fns';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type DatePickerProps = {
	date: Date | undefined;
	setDate:
		| React.Dispatch<React.SetStateAction<Date | undefined>>
		| ((date?: Date) => void);
	error: string | undefined;
	note?: string;
};

export default function DatePicker({
	date,
	setDate,
	error,
	note,
}: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<div className='text-muted-foreground space-y-2'>
					<Label className='flex gap-1 items-center'>
						Date:
						{note && <p className='text-xs text-muted-foreground'>{note}</p>}
					</Label>
					<Button
						type='button'
						variant={'outline'}
						className={cn(
							'w-full justify-start text-left font-normal',
							!date && 'text-muted-foreground'
						)}
					>
						<CalendarIcon className='mr-2 h-4 w-4' />
						{date ? format(date, 'PPP') : <span>Pick a date </span>}
					</Button>
					{error && <p className='text-xs text-destructive'>{error}</p>}
				</div>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0'>
				<Calendar
					mode='single'
					selected={date}
					onSelect={(date) => {
						setDate(date);
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
