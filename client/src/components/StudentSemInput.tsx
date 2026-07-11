import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useUserStore } from '@/store/user';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { updateStudentTerm } from '@/api/student-portal';

type StudentSemInputProps = {
  hideLabel?: boolean;
};

export default function StudentSemInput({ hideLabel }: StudentSemInputProps) {
  const { toast } = useToast();
  const { user: currentUser, setUser } = useUserStore((state) => state);

  const onChange = async (value: string) => {
    if (!currentUser) return;

    const previous = currentUser.activeSemDB;
    try {
      const updatedUser = { ...currentUser, activeSemDB: value as '1' | '2' };
      setUser(updatedUser);
      queryClient.resetQueries();
      await updateStudentTerm({ activeSemDB: value });
    } catch (error: any) {
      setUser({ ...currentUser, activeSemDB: previous });
      queryClient.resetQueries();
      toast({
        title: 'Failed to save',
        description: error.message || 'An error occurred while saving',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-2 justify-end">
      {!hideLabel && <Label className="ml-1">Semester:</Label>}
      <Select value={currentUser?.activeSemDB ?? '1'} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Semester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1st sem</SelectItem>
          <SelectItem value="2">2nd sem</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
