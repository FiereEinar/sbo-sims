import { Pencil } from 'lucide-react';
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
import { fetchAvailableCourses, submitStudentForm, submitUpdateStudentForm } from '@/api/student';
import { z } from 'zod';
import Plus from '../icons/plus';
import { Student } from '@/types/student';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import ErrorText from '../ui/error-text';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import _ from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SelectContainer, SelectContainerItem } from '../ui/select';

export type StudentFormValues = z.infer<typeof studentSchema>;

type AddStudentFormProps = {
	mode?: 'edit' | 'add';
	student?: Student;
};

export function AddStudentForm({ mode = 'add', student }: AddStudentFormProps) {
	if (student === undefined && mode === 'edit') {
		throw new Error(
			'No student data provided while student form mode is on edit'
		);
	}

	const navigate = useNavigate();
	const courseInputRef = useRef<HTMLInputElement>(null);
	const [courseInput, setCourseInput] = useState(student?.course ?? '');
	const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);

	const { data: availableCourses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	const filteredCourses = availableCourses?.filter((course) =>
		course.toLowerCase().includes(courseInput.toLowerCase())
	) ?? [];

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<StudentFormValues>({
		resolver: zodResolver(studentSchema),
	});

	useEffect(() => {
		if (student) {
			setValue('email', student.email);
			setValue('firstname', _.startCase(student.firstname));
			setValue('lastname', _.startCase(student.lastname));
			setValue('studentID', student.studentID);
			setValue('middlename', student.middlename);
			setValue('course', student.course);
			setValue('gender', student.gender);
			setValue('year', student.year?.toString());
			setCourseInput(student.course ?? '');
		}
	}, [student, setValue]);

	const onSubmit = async (data: StudentFormValues) => {
		try {
			if (mode === 'add') await submitStudentForm(data);
			if (mode === 'edit')
				await submitUpdateStudentForm(student?.studentID ?? '', data);

			await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT] });
			navigate(`/student/${student?.studentID ?? ''}`, { replace: true });
			reset();
			setCourseInput('');
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit student form',
			});
		}
	};

	const selectCourse = (course: string) => {
		setCourseInput(course);
		setValue('course', course);
		setShowCourseSuggestions(false);
		if (courseInputRef.current) courseInputRef.current.focus();
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				{mode === 'add' ? (
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add Student</p>
					</Button>
				) : (
					<Button className='flex gap-1' size='sm' variant='outline'>
						<Pencil className='size-4' />
						<p>Edit</p>
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Student</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<StudentFormValues>
						name='studentID'
						registerFn={register}
						errors={errors}
						label='Student ID:'
						id='studentID'
						isDisabled={mode === 'edit'}
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
					<div className='flex gap-2'>
						<InputField<StudentFormValues>
							name='middlename'
							registerFn={register}
							errors={errors}
							label='Middlename(optional):'
							id='middlename'
						/>

						{/* Course combo-box with dropdown suggestions */}
						<div className='space-y-1 text-muted-foreground w-full'>
							<Label htmlFor='course'>Course:</Label>
							<input
								type='hidden'
								{...register('course')}
							/>
							<Input
								ref={courseInputRef}
								id='course'
								value={courseInput}
								autoComplete='off'
								onChange={(e) => {
									setCourseInput(e.target.value);
									setValue('course', e.target.value);
									setShowCourseSuggestions(true);
								}}
								onFocus={() => setShowCourseSuggestions(true)}
								onBlur={() => {
									// Delay hiding to allow click on dropdown item
									setTimeout(() => setShowCourseSuggestions(false), 200);
								}}
								placeholder='Type or select a course'
							/>
							{/* Dropdown suggestions */}
							<div className='relative w-full'>
								{showCourseSuggestions && filteredCourses.length > 0 && (
									<SelectContainer>
										{filteredCourses.map((course) => (
											<SelectContainerItem
												type='button'
												onClick={() => selectCourse(course)}
												key={course}
											>
												{course}
											</SelectContainerItem>
										))}
									</SelectContainer>
								)}
							</div>
							{errors.course && errors.course.message && (
								<ErrorText>{errors.course.message.toString()}</ErrorText>
							)}
						</div>
					</div>
					<div className='flex gap-2'>
						<InputField<StudentFormValues>
							name='gender'
							registerFn={register}
							errors={errors}
							label='Gender: (M/F)'
							id='gender'
						/>
						<InputField<StudentFormValues>
							name='year'
							type='number'
							registerFn={register}
							errors={errors}
							label='Year:'
							id='year'
						/>
					</div>
					<InputField<StudentFormValues>
						name='email'
						registerFn={register}
						errors={errors}
						label='Email(optional):'
						id='email'
					/>

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

