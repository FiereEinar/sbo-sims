import axiosInstance from '@/api/axiosInstance';
import SidebarLink from '../SidebarLink';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Power } from 'lucide-react';

export default function LogoutButton() {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onLogout = async () => {
		try {
			await axiosInstance.get('/auth/logout');
			localStorage.removeItem('accessToken');
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
			<div className='pointer-events-none'>
				<SidebarLink link={{ icon: Power, name: 'Logout', path: '/logout' }} />
			</div>
		</button>
	);
}
