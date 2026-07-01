import adminAxiosInstance from '@/api/adminAxiosInstance';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trefoil } from 'ldrs';
import { User } from '@/types/user';
import { useUserStore } from '@/store/user';

trefoil.register();

/**
 * ProtectedRoute for the Global Super Admin portal.
 * Verifies the user is authenticated AND has role === 'central-admin'.
 * Redirects to /admin/login otherwise.
 */
export default function AdminProtectedRoute({ children }: PropsWithChildren) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const setUser = useUserStore((state) => state.setUser);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				const { data } = await adminAxiosInstance.get<User>('/auth/check-auth');

				if (data.role !== 'central-admin') {
					setIsAuthenticated(false);
					navigate('/admin/login', { replace: true });
					return;
				}

				setUser(data);
				setIsAuthenticated(true);
			} catch {
				setIsAuthenticated(false);
				navigate('/admin/login', { replace: true });
			}
		})();
	}, [navigate, setUser]);

	if (!isAuthenticated) {
		const isDark = document.documentElement.classList.contains('dark');
		return (
			<section className='w-dvw h-dvh flex flex-col justify-center items-center'>
				<l-trefoil
					size='80'
					stroke='4'
					stroke-length='0.15'
					bg-opacity='0.1'
					speed='1.4'
					color={isDark ? 'white' : 'black'}
				/>
				<p className='text-xl font-bold mt-5'>Authenticating</p>
			</section>
		);
	}

	return children;
}
