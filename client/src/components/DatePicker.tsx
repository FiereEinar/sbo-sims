import { format, parse, isValid } from 'date-fns';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarIcon, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { useState } from 'react';

type DatePickerProps = {
	date: Date | undefined;
	setDate:
		| React.Dispatch<React.SetStateAction<Date | undefined>>
		| ((date?: Date) => void);
	error: string | undefined;
	note?: string;
};

function parseManualDate(value: string): Date | undefined {
	const normalized = value.replace(/\//g, '-');
	const parsed = parse(normalized, 'MM-dd-yyyy', new Date());
	return isValid(parsed) ? parsed : undefined;
}

export default function DatePicker({
	date,
	setDate,
	error,
	note,
}: DatePickerProps) {
	const [mode, setMode] = useState<'picker' | 'manual'>(
		() => (localStorage.getItem('dateInputMode') as 'picker' | 'manual') || 'picker'
	);
	const [manualValue, setManualValue] = useState('');
	const [manualError, setManualError] = useState('');

	const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setManualValue(val);
		setManualError('');

		if (val.trim() === '') {
			setDate(undefined);
			return;
		}

		const parsed = parseManualDate(val);
		if (parsed) {
			setDate(parsed);
			setManualError('');
		} else {
			setManualError('Invalid date. Use MM-DD-YYYY');
		}
	};

	const toggleMode = () => {
		setMode((prev) => {
			const next = prev === 'picker' ? 'manual' : 'picker';
			localStorage.setItem('dateInputMode', next);
			return next;
		});
		setManualError('');
	};

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<Label className='flex gap-1 items-center text-muted-foreground'>
					Date:
					{note && <p className='text-xs text-muted-foreground'>{note}</p>}
				</Label>
				<Button
					type='button'
					variant='ghost'
					size='sm'
					className='h-6 px-2 text-xs text-muted-foreground'
					onClick={toggleMode}
				>
					{mode === 'picker' ? (
						<><Type className='size-3 mr-1' /> Manual</>
					) : (
						<><CalendarIcon className='size-3 mr-1' /> Calendar</>
					)}
				</Button>
			</div>

			{mode === 'picker' ? (
				<Popover>
					<PopoverTrigger asChild>
						<Button
							type='button'
							variant={'outline'}
							className={cn(
								'w-full justify-start text-left font-normal',
								!date && 'text-muted-foreground'
							)}
						>
							<CalendarIcon className='mr-2 h-4 w-4' />
							{date ? format(date, 'PPP') : <span>Pick a date</span>}
						</Button>
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
			) : (
				<div className='space-y-1'>
					<Input
						type='text'
						placeholder='MM-DD-YYYY'
						value={manualValue}
						onChange={handleManualChange}
					/>
					<p className='text-xs text-muted-foreground'>
						Format: MM-DD-YYYY or MM/DD/YYYY
					</p>
					{manualError && (
						<p className='text-xs text-destructive'>{manualError}</p>
					)}
				</div>
			)}

			{error && <p className='text-xs text-destructive'>{error}</p>}
		</div>
	);
}
