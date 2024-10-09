import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import InputField from '../InputField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema } from '@/lib/validations/studentSchema';
import { fetchStudents, submitStudentForm } from '@/api/student';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import Plus from '../icons/plus';

export type StudentFormValues = z.infer<typeof studentSchema>;

export function AddStudentForm() {
	const { refetch } = useQuery({
		queryKey: ['students'],
		queryFn: fetchStudents,
	});

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<StudentFormValues>({
		resolver: zodResolver(studentSchema),
	});

	const onSubmit = async (data: StudentFormValues) => {
		try {
			const result = await submitStudentForm(data);

			if (!result) {
				setError('root', {
					message: 'Something went wrong while trying to submit your form',
				});
				return;
			}

			if (!result.success) {
				setError('root', {
					message: `${result.message} - ${result.error ?? ''}`,
				});
				return;
			}

			refetch();
			reset();
		} catch (err: any) {
			setError('root', { message: 'Failed to submit student form' });
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='flex justify-center gap-1' size='sm'>
					<Plus />
					<p>Add Student</p>
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add Student</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<StudentFormValues>
						name='studentID'
						registerFn={register}
						errors={errors}
						label='Student ID:'
						id='studentID'
					/>
					<InputField<StudentFormValues>
						name='firstname'
						registerFn={register}
						errors={errors}
						label='Firstname:'
						id='firstname'
					/>
					<InputField<StudentFormValues>
						name='lastname'
						registerFn={register}
						errors={errors}
						label='Lastname:'
						id='lastname'
					/>
					<InputField<StudentFormValues>
						name='email'
						registerFn={register}
						errors={errors}
						label='Email(optional):'
						id='email'
					/>

					{errors.root && errors.root.message && (
						<p className='text-xs text-destructive'>
							{errors.root.message.toString()}
						</p>
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
