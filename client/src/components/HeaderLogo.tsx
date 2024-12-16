import { useUserStore } from '@/store/user';
import Header from './ui/header';

export default function HeaderLogo() {
	const currentUser = useUserStore((state) => state.user);
	const semester =
		currentUser?.activeSemDB == '2' ? '2nd semester' : '1st semester';

	return (
		<div className='flex gap-2 items-center text-white'>
			<img
				className='size-16 rounded-full border'
				src='/images/SBO_LOGO.jpg'
				alt=''
			/>
			<div className='text-muted-foreground'>
				<Header>SIMS</Header>
				<p className='text-xs'>
					{currentUser?.activeSchoolYearDB} -{' '}
					{parseInt(currentUser?.activeSchoolYearDB as string) + 1}
				</p>
				<p className='text-xs'>{semester}</p>
			</div>
		</div>
	);
}
