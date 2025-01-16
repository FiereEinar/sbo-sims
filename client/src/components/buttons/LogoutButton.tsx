import axiosInstance from '@/api/axiosInstance';
import SidebarLink from '../SidebarLink';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function LogoutButton() {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onLogout = async () => {
		try {
			await axiosInstance.get('/auth/logout');
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
		<button onClick={onLogout}>
			<SidebarLink link={{ icon: 'logout', name: 'Logout', path: '/logout' }} />
		</button>
	);
}
