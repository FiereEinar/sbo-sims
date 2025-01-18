import axiosInstance from '@/api/axiosInstance';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trefoil } from 'ldrs';
import { User } from '@/types/user';
import { useUserStore } from '@/store/user';

trefoil.register();

export default function ProtectedRoute({ children }: PropsWithChildren) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const setUser = useUserStore((state) => state.setUser);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				const { data } = await axiosInstance.get<User>('/auth/check-auth');
				setUser(data);
				setIsAuthenticated(true);
			} catch (err: any) {
				setIsAuthenticated(false);
				navigate('/login', { replace: true });
			}
		})();
	}, [navigate]);

	if (!isAuthenticated) {
		return (
			<section className='w-dvw h-dvh flex flex-col justify-center items-center'>
				<l-trefoil
					size='80'
					stroke='4'
					stroke-length='0.15'
					bg-opacity='0.1'
					speed='1.4'
					color='white'
				/>
				<p className='text-xl font-bold mt-5'>Authenticating</p>
			</section>
		);
	}

	return children;
}
