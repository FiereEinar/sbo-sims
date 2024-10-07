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
import { Student } from '@/types/student';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema } from '@/lib/validations/studentSchema';
import { fetchStudents, submitStudentForm } from '@/api/student';
import { useQuery } from '@tanstack/react-query';

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
	} = useForm<Student>({
		resolver: zodResolver(studentSchema),
	});

	const onSubmit = async (data: Student) => {
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
					message: `${result.message}\n${result.error ?? ''}`,
				});
				return;
			}

			refetch();
			reset();
		} catch (err: any) {
			setError('root', { message: 'Failed to submit form' });
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='flex justify-center gap-1' size='sm'>
					<img className='size-5' src='/icons/plus.svg' alt='' />
					<p>Add Student</p>
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add Student</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<Student>
						name='studentID'
						registerFn={register}
						errors={errors}
						label='Student ID:'
						id='studentID'
					/>
					<InputField<Student>
						name='firstname'
						registerFn={register}
						errors={errors}
						label='Firstname:'
						id='firstname'
					/>
					<InputField<Student>
						name='lastname'
						registerFn={register}
						errors={errors}
						label='Lastname:'
						id='lastname'
					/>
					<InputField<Student>
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
