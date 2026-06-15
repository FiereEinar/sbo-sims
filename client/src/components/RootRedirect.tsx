import axiosInstance from '@/api/axiosInstance';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/user';
import { useUserStore } from '@/store/user';
import { trefoil } from 'ldrs';

trefoil.register();

export default function RootRedirect() {
	const setUser = useUserStore((state) => state.setUser);
	const navigate = useNavigate();

	useEffect(() => {
		(async () => {
			try {
				const { data } = await axiosInstance.get<User>('/auth/check-auth');
				setUser(data);

				if (data.organization?.slug) {
					navigate(`/${data.organization.slug}`, { replace: true });
				} else {
					navigate('/login', { replace: true });
				}
			} catch (err: any) {
				navigate('/login', { replace: true });
			}
		})();
	}, [navigate, setUser]);

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
			<p className='text-xl font-bold mt-5'>Loading Workspace</p>
		</section>
	);
}
