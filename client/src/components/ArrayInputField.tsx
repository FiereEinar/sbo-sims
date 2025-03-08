import { useRef, useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Cross2Icon } from '@radix-ui/react-icons';

type ArrayInputFieldProps = {
	label: string;
	placeholder?: string;
	onSubmit: (value: string) => void;
	onRemove: (value: string) => void;
	values: string[];
};

export default function ArrayInputField({
	onSubmit,
	onRemove,
	values,
	label,
	placeholder,
}: ArrayInputFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState('');

	const onInputSubmit = () => {
		onSubmit(inputValue);
		setInputValue('');
		if (inputRef.current) inputRef.current.focus();
	};

	return (
		<div className='space-y-1 text-muted-foreground'>
			<Label htmlFor='departments'>{label}</Label>
			<div>
				<div className='flex'>
					<Input
						id='departments'
						ref={inputRef}
						value={inputValue}
						autoComplete='off'
						onChange={(e) => setInputValue(e.target.value)}
						onKeyUpCapture={(e) => {
							if (e.key === 'Enter') onInputSubmit();
						}}
						className='rounded-r-none'
						placeholder={placeholder}
					/>
					<Button
						onClick={onInputSubmit}
						className='rounded-l-none'
						type='button'
						variant='secondary'
					>
						Add
					</Button>
				</div>
			</div>
			<div className=' w-full flex flex-wrap'>
				{values.map((val) => (
					<Badge
						className='flex justify-between size-fit pr-1 mb-1 mx-[2px]'
						key={val}
					>
						<p>{val}</p>
						<button onClick={() => onRemove(val)} type='button'>
							<Cross2Icon className='h-4 w-4' />
						</button>
					</Badge>
				))}
			</div>
		</div>
	);
}
