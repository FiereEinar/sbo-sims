import { navbarLinks } from '@/constants';
import DarkModeToggle from './buttons/DarkModeToggle';
import SidebarLink from './SidebarLink';
import Header from './ui/header';
import { useUserStore } from '@/store/user';
import LogoutButton from './buttons/LogoutButton';

export default function LeftSidebar() {
	const currentUser = useUserStore((state) => state.user);

	const semester =
		currentUser?.activeSemDB == '2' ? '2nd semester' : '1st semester';

	return (
		<aside className='transition-all w-[200px] font-semibold bg-card h-dvh flex flex-col flex-shrink-0 justify-between p-5 text-sm text-muted-foreground'>
			<div className='flex flex-col justify-between gap-5'>
				<>
					<div className='flex gap-2 items-center mb-3 text-white'>
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
					{navbarLinks.map((link) => (
						<SidebarLink key={link.name} link={link} />
					))}
				</>
			</div>

			<div className='flex flex-col justify-between gap-3'>
				<SidebarLink
					link={{ icon: 'settings', name: 'Settings', path: '/settings' }}
				/>
				<DarkModeToggle text='Toggle Theme' />
				<LogoutButton />
			</div>
		</aside>
	);
}
