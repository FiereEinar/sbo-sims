import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import axiosInstance from '@/api/axiosInstance';
import studentAxiosInstance from '@/api/studentAxiosInstance';
import SidebarLink from '../SidebarLink';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/user';
import { Power } from 'lucide-react';
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
} from '../ui/alert-dialog';

export default function LogoutButton() {
  const { toast } = useToast();
  const navigate = useTenantNavigate();

  const onLogout = async () => {
    try {
      const user = useUserStore.getState().user;
      if (user?.role === 'student') {
        await studentAxiosInstance.get('/auth/logout');
      } else {
        await axiosInstance.get('/auth/logout');
      }
      localStorage.removeItem('accessToken');
      // Stop the sync engine loop and clear stored credentials
      window.electronAPI?.clearSyncContext?.();
      navigate('/login');
    } catch (err: any) {
      console.error('Failed to logout');
      toast({
        variant: 'destructive',
        title: 'Failed to logout',
        description: err.message,
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button>
          <div className="pointer-events-none">
            <SidebarLink
              link={{ icon: Power, name: 'Logout', path: '/logout' }}
            />
          </div>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to login again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onLogout}>Logout</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
