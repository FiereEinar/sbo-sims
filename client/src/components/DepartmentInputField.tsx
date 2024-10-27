import { Cross2Icon } from '@radix-ui/react-icons';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { fetchAvailableCourses } from '@/api/student';
import { Department } from '@/types/deparment';
import { SelectContainer, SelectContainerItem } from './ui/select';

type DepartmentInputFieldProps = {
	onSubmit: (value: string) => void;
	onRemove: (id: string) => void;
	selectedDepartments: Department[];
};

export default function DepartmentInputField({
	onSubmit,
	onRemove,
	selectedDepartments,
}: DepartmentInputFieldProps) {
	const depInputRef = useRef<HTMLInputElement>(null);
	const [departmentInput, setDepartmentInput] = useState('');

	const { data: availableCourses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	const onInputSubmit = () => {
		onSubmit(departmentInput);
		setDepartmentInput('');
		if (depInputRef.current) depInputRef.current.focus();
	};

	return (
		<div className='space-y-1 text-muted-foreground'>
			<Label htmlFor='departments'>Departments: </Label>
			<div>
				<div className='flex'>
					<Input
						id='departments'
						ref={depInputRef}
						value={departmentInput}
						onChange={(e) => setDepartmentInput(e.target.value)}
						onKeyUpCapture={(e) => {
							if (e.key === 'Enter') onInputSubmit();
						}}
						className='rounded-r-none'
						placeholder='Add departments under this Organization'
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
				<div className='relative w-full'>
					{availableCourses && departmentInput && (
						<SelectContainer>
							{availableCourses.map((course) => (
								<SelectContainerItem
									type='button'
									onClick={onInputSubmit}
									key={course}
								>
									{course}
								</SelectContainerItem>
							))}
						</SelectContainer>
					)}
				</div>
			</div>
			<div className=' w-full flex flex-wrap'>
				{selectedDepartments.map((dep) => (
					<Badge
						className='flex justify-between size-fit pr-1 mb-1 mx-[2px]'
						key={dep.id}
					>
						<p>{dep.name}</p>
						<button onClick={() => onRemove(dep.id)} type='button'>
							<Cross2Icon className='h-4 w-4' />
						</button>
					</Badge>
				))}
			</div>
		</div>
	);
}
