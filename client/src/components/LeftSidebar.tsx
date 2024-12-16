import { navbarLinks } from '@/constants';
import DarkModeToggle from './buttons/DarkModeToggle';
import SidebarLink from './SidebarLink';
import LogoutButton from './buttons/LogoutButton';
import HeaderLogo from './HeaderLogo';

export default function LeftSidebar() {
	return (
		<aside className='transition-all w-[200px] font-semibold bg-card h-dvh flex flex-col flex-shrink-0 justify-between p-5 text-sm text-muted-foreground'>
			<div className='flex flex-col justify-between gap-5'>
				<HeaderLogo />
				{navbarLinks.map((link) => (
					<SidebarLink key={link.name} link={link} />
				))}
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
