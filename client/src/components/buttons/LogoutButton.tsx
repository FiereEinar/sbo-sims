import axiosInstance from '@/api/axiosInstance';
import SidebarLink from '../SidebarLink';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
	const navigate = useNavigate();

	const onLogout = async () => {
		try {
			await axiosInstance.get('/auth/logout');
			navigate('/login');
		} catch (err: any) {
			console.error('Failed to logout');
		}
	};

	return (
		<button onClick={onLogout}>
			<SidebarLink link={{ icon: 'logout', name: 'Logout', path: '/logout' }} />
		</button>
	);
}
