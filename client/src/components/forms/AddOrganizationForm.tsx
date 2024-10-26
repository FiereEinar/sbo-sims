import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import InputField from '../InputField';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import Plus from '../icons/plus';
import ErrorText from '../ui/error-text';
import { organizationSchema } from '@/lib/validations/organizationSchema';
import { submitOrganizationForm } from '@/api/organization';
import { useRef, useState } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { Cross2Icon } from '@radix-ui/react-icons';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

type organization = {
	id: string;
	name: string;
};

export default function AddOrganizationForm() {
	const [departments, setDepartments] = useState<organization[]>([]);
	const [departmentInput, setDepartmentInput] = useState('');
	const depInputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<OrganizationFormValues>({
		resolver: zodResolver(organizationSchema),
	});

	const onSubmit = async (data: OrganizationFormValues) => {
		try {
			const departmentsArray: string[] = [];
			departments.map((dep) => departmentsArray.push(dep.name));
			data.departments = departmentsArray;

			const result = await submitOrganizationForm(data);

			if (!result) {
				setError('root', {
					message: 'Something went wrong while trying to submit your form',
				});
				return;
			}

			if (!result.success) {
				setError('root', {
					message: `${result.message}\n${result.error ?? ''}`,
				});
				return;
			}

			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGANIZATION] });
			reset();
			setDepartments([]);
		} catch (err: any) {
			setError('root', {
				message: 'Failed to submit create organization form',
			});
		}
	};

	const onDepartmentAdd = () => {
		if (departmentInput.length === 0) return;
		setDepartments((prev) => [
			...prev,
			{ name: departmentInput.toUpperCase(), id: uuidv4() },
		]);
		setDepartmentInput('');
		if (depInputRef.current) depInputRef.current.focus();
	};

	const onDepartmentRemove = (id: string) => {
		setDepartments((prev) => prev.filter((org) => org.id !== id));
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='flex justify-center gap-1' size='sm'>
					<Plus />
					<p>Add Organization</p>
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add Organization</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form
					onKeyDown={(e) => {
						if (e.key === 'Enter') e.preventDefault();
					}}
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-2'
				>
					<InputField<OrganizationFormValues>
						name='name'
						registerFn={register}
						errors={errors}
						label='Organization name:'
						id='name'
					/>

					<InputField<OrganizationFormValues>
						name='governor'
						registerFn={register}
						errors={errors}
						label='Current Governor for this Organization:'
						id='governor'
					/>

					<InputField<OrganizationFormValues>
						name='treasurer'
						registerFn={register}
						errors={errors}
						label='Current Treasurer for this Organization:'
						id='treasurer'
					/>

					<div className='space-y-1 text-muted-foreground'>
						<Label htmlFor='departments'>Departments: </Label>
						<div className='flex'>
							<Input
								id='departments'
								ref={depInputRef}
								value={departmentInput}
								onChange={(e) => setDepartmentInput(e.target.value)}
								onKeyUpCapture={(e) => {
									if (e.key === 'Enter') onDepartmentAdd();
								}}
								className='rounded-r-none'
								placeholder='Add departments under this Organization'
							/>
							<Button
								onClick={onDepartmentAdd}
								className='rounded-l-none'
								type='button'
								variant='secondary'
							>
								Add
							</Button>
						</div>
						<div className=' w-full flex flex-wrap'>
							{departments.map((dep) => (
								<Badge
									className='flex justify-between size-fit pr-1 mb-1 mx-[2px]'
									key={dep.id}
								>
									<p>{dep.name}</p>
									<button
										onClick={() => onDepartmentRemove(dep.id)}
										type='button'
									>
										<Cross2Icon className='h-4 w-4' />
									</button>
								</Badge>
							))}
						</div>

						{errors.departments && errors.departments.message && (
							<ErrorText>{errors.departments.message.toString()}</ErrorText>
						)}
					</div>

					{errors.root && errors.root.message && (
						<ErrorText>{errors.root.message.toString()}</ErrorText>
					)}

					<div className='flex justify-end'>
						<Button className='' disabled={isSubmitting} type='submit'>
							Submit
						</Button>
					</div>
				</form>

				<DialogFooter></DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
