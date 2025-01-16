import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from './ui/label';

type DatePickerWithRangeProps = {
	setStartDate: (date?: Date) => void;
	setEndDate: (date?: Date) => void;
};

export function DatePickerWithRange({
	setStartDate,
	setEndDate,
}: DatePickerWithRangeProps) {
	const [date, setDate] = React.useState<DateRange | undefined>({
		from: undefined,
		to: undefined,
	});

	React.useEffect(() => {
		setStartDate(date?.from);
		setEndDate(date?.to);
	}, [date?.from, date?.to]);

	return (
		<div className={cn('grid gap-2')}>
			<Popover>
				<PopoverTrigger asChild>
					<div className='space-y-2'>
						<Label className='flex gap-1 items-center'>Date:</Label>
						<Button
							id='date'
							variant={'outline'}
							className={cn(
								'w-[300px] justify-start text-left font-normal',
								!date && 'text-muted-foreground'
							)}
						>
							{/* <CalendarIcon /> */}
							{date?.from ? (
								date.to ? (
									<>
										{format(date.from, 'LLL dd, y')} -{' '}
										{format(date.to, 'LLL dd, y')}
									</>
								) : (
									format(date.from, 'LLL dd, y')
								)
							) : (
								<span>Pick a date range</span>
							)}
						</Button>
					</div>
				</PopoverTrigger>
				<PopoverContent className='w-auto p-0' align='start'>
					<Calendar
						initialFocus
						mode='range'
						defaultMonth={date?.from}
						selected={date}
						onSelect={setDate}
						numberOfMonths={2}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
