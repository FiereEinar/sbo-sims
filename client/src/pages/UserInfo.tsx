import { useTenantNavigate } from '../hooks/useTenantNavigate';
import { fetchUserByID } from '@/api/user';
import BackButton from '@/components/buttons/BackButton';
import { AddUserForm } from '@/components/forms/AddUserForm';
import HasPermission from '@/components/HasPermission';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import StudentDataCardLoading from '@/components/loading/StudentDataCardLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentDataCard from '@/components/student/StudentDataCard';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/api/user';
import { queryClient } from '@/main';

export default function UserInfo() {
  const { userID } = useParams();
  const navigate = useTenantNavigate();
  const { toast } = useToast();
  if (userID === undefined) return;

  const {
    data: user,
    isLoading: isloading,
    error: error,
  } = useQuery({
    queryKey: [QUERY_KEYS.USERS, { userID }],
    queryFn: () => fetchUserByID(userID),
  });

  if (error) {
    return <p>Error</p>;
  }

  const handleDelete = async () => {
    try {
      await deleteUser(userID);
      toast({ title: 'User deleted successfully' });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      navigate('/user', { replace: true });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete user',
        description: error.message || 'An error occurred',
      });
    }
  };

  return (
    <SidebarPageLayout>
      <BackButton />

      {isloading && <StickyHeaderLoading />}

      {user && (
        <StickyHeader>
          <Header>User Information</Header>

          <div className="flex items-center gap-2">
            <HasPermission permissions={[MODULES.USER_UPDATE]}>
              <AddUserForm mode="edit" user={user} />
            </HasPermission>

            <HasPermission permissions={[MODULES.USER_DELETE]}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex gap-1"
                    size="sm"
                  >
                    <Trash size={16} />
                    <p>Delete</p>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the user's account and remove their data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </HasPermission>
          </div>
        </StickyHeader>
      )}

      <div className="space-y-6">
        {isloading && <StudentDataCardLoading />}

        {user && (
          <StudentDataCard
            student={{
              __v: 0,
              _id: user._id,
              firstname: user.firstname,
              middlename: '',
              lastname: user.lastname,
              email: user.email,
              studentID: user.studentID,
              year: 0,
              course: '',
              gender: '',
              updatedAt: user.updatedAt,
              createdAt: user.createdAt,
            }}
          />
        )}
      </div>
    </SidebarPageLayout>
  );
}
