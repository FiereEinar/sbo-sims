import axiosInstance from '@/api/axiosInstance';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { trefoil } from 'ldrs';
import { User } from '@/types/user';
import { useUserStore } from '@/store/user';

trefoil.register();

export default function ProtectedRoute({ children }: PropsWithChildren) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const setUser = useUserStore((state) => state.setUser);
	const navigate = useNavigate();
	const { orgSlug } = useParams<{ orgSlug: string }>();

	useEffect(() => {
		(async () => {
			try {
				const { data } = await axiosInstance.get<User>('/auth/check-auth');
				setUser(data);

				// Students should not access org portal routes
				if (data.role === 'student') {
					setIsAuthenticated(false);
					navigate('/student/dashboard', { replace: true });
					return;
				}

				if (orgSlug && data.organization?.slug !== orgSlug) {
					setIsAuthenticated(false);
					navigate(`/${orgSlug}/login`, { replace: true });
					return;
				}

				setIsAuthenticated(true);
			} catch (err: any) {
				setIsAuthenticated(false);
				if (orgSlug) {
					navigate(`/${orgSlug}/login`, { replace: true });
				} else {
					navigate('/login', { replace: true });
				}
			}
		})();
	}, [navigate, orgSlug, setUser]);

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
