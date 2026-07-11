import { useUserStore } from '@/store/user';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { AVAILABLE_SCHOOL_YEARS } from '@/constants';
import { updateStudentTerm } from '@/api/student-portal';

type StudentSchoolYearInputProps = {
  hideLabel?: boolean;
};

export default function StudentSchoolYearInput({ hideLabel }: StudentSchoolYearInputProps) {
  const { toast } = useToast();
  const { user: currentUser, setUser } = useUserStore((state) => state);

  const onChange = async (value: string) => {
    if (!currentUser) return;

    const previous = currentUser.activeSchoolYearDB;
    try {
      const updatedUser = { ...currentUser, activeSchoolYearDB: value };
      setUser(updatedUser);
      queryClient.resetQueries();
      await updateStudentTerm({ activeSchoolYearDB: value });
    } catch (error: any) {
      setUser({ ...currentUser, activeSchoolYearDB: previous });
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
      {!hideLabel && <Label className="ml-1">School Year:</Label>}
      <Select value={currentUser?.activeSchoolYearDB} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_SCHOOL_YEARS.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year} - {year + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
