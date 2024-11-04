import { useUserStore } from '@/store/user';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { APIResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { queryClient } from '@/main';

export default function SaveSettingsButton() {
	const { toast } = useToast();
	const navigate = useNavigate();
	const { user: currentUser, setUser } = useUserStore((state) => state);

	const onSave = async () => {
		try {
			if (!currentUser) {
				toast({
					variant: 'destructive',
					title: 'No data for current user',
					description: 'Login first to continue',
				});
				navigate('/login');
				return;
			}

			const { data: result } = await axiosInstance.put<APIResponse<User>>(
				`/user/${currentUser._id}`,
				currentUser
			);

			if (!result.success) {
				toast({
					variant: 'destructive',
					title: 'Failed to save settings',
					description: `${result.message}. ${result.error ?? ''}`,
				});
				return;
			}

			setUser(result.data);
			toast({ title: 'Settings saved successfully!' });
			queryClient.resetQueries();
		} catch (err: any) {
			console.error('Failed to save settings', err);
			toast({
				title: 'Failed to save settings',
				variant: 'destructive',
			});
		}
	};
	return (
		<Button onClick={onSave} size='sm'>
			Save Changes
		</Button>
	);
}
