import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
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
import { requestDeleteStudent } from '@/api/student';
import { AddStudentForm } from '../forms/AddStudentForm';
import { queryClient } from '@/main';
import { MODULES, QUERY_KEYS } from '@/constants';
import HasPermission from '../HasPermission';

type EditAndDeleteStudentButtonProps = {
  student: Student;
};

export default function EditAndDeleteStudentButton({
  student,
}: EditAndDeleteStudentButtonProps) {
  return (
    <div className="space-x-2 flex">
      <HasPermission permissions={[MODULES.STUDENT_UPDATE]}>
        <EditButton student={student} />
      </HasPermission>
      <HasPermission permissions={[MODULES.STUDENT_DELETE]}>
        <DeleteButton studentID={student.studentID} />
      </HasPermission>
    </div>
  );
}

type DeleteButtonProps = {
  studentID: string;
};

function DeleteButton({ studentID }: DeleteButtonProps) {
  const { toast } = useToast();
  const navigate = useTenantNavigate();

  const onDelete = async () => {
    try {
      navigate('/student');

      await requestDeleteStudent(studentID);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT] });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete student',
        description:
          err.message ||
          'A network error occured while trying to delete student',
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          className="flex gap-1 rounded-full"
          variant="destructive"
          size="sm"
        >
          <Trash2 className="size-4" />
          <p className="hidden md:block">Delete</p>
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
  return <AddStudentForm mode="edit" student={student} />;
}
