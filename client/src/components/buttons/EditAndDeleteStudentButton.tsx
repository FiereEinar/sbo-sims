import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { QueryObserverResult, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Student } from '@/types/student';
import { fetchStudentByID, requestDeleteStudent } from '@/api/student';
import { AddStudentForm } from '../forms/AddStudentForm';

type EditAndDeleteStudentButtonProps = {
	student: Student;
};

export default function EditAndDeleteStudentButton({
	student,
}: EditAndDeleteStudentButtonProps) {
	const { refetch } = useQuery({
		queryKey: [`student_${student.studentID}`],
		queryFn: () => fetchStudentByID(student.studentID),
	});

	return (
		<div className='space-x-2 flex'>
			<EditButton student={student} />
			<DeleteButton studentID={student.studentID} refetch={refetch} />
		</div>
	);
}

type DeleteButtonProps = {
	studentID: string;
	refetch: () => Promise<QueryObserverResult<Student | undefined, Error>>;
};

function DeleteButton({ studentID, refetch }: DeleteButtonProps) {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onDelete = async () => {
		try {
			const result = await requestDeleteStudent(studentID);

			if (!result) {
				toast({
					title: 'Failed to delete student',
					description: 'A network error occured while trying to delete student',
				});
				return;
			}

			if (!result.success) {
				toast({
					title: 'Failed to delete student',
					description: `${result.message} ${result.error ?? ''}`,
				});
				return;
			}

			refetch();
			navigate('/student');
		} catch (err: any) {
			toast({
				title: 'Failed to delete student',
				description: 'A network error occured while trying to delete student',
			});
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button className='flex gap-1' variant='destructive' size='sm'>
					<img src='/icons/delete.svg' className='size-5' alt='' />
					<p>Delete</p>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the
						student and remove the data from the database.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function EditButton({ student }: EditAndDeleteStudentButtonProps) {
	return <AddStudentForm mode='edit' student={student} />;
}
