import { navbarLinks } from '@/constants';
import DarkModeToggle from './buttons/DarkModeToggle';
import SidebarLink from './SidebarLink';
import LogoutButton from './buttons/LogoutButton';

export default function LeftSidebar() {
	return (
		<aside className='transition-all font-semibold bg-card h-dvh flex flex-col justify-between p-5 text-sm text-muted-foreground'>
			<div className='flex flex-col justify-between gap-3'>
				{navbarLinks.map((link) => (
					<SidebarLink key={link.name} link={link} />
				))}
			</div>

			<div className='flex flex-col justify-between gap-3'>
				<DarkModeToggle text='Toggle Theme' />
				<LogoutButton />
			</div>
		</aside>
	);
}
