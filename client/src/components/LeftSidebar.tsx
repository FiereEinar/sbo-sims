import { navbarLinks, SidebarNavLinkType } from '@/constants';
import DarkModeToggle from './buttons/DarkModeToggle';
import SidebarLink from './SidebarLink';
import LogoutButton from './buttons/LogoutButton';
import HeaderLogo from './HeaderLogo';
import { useUserStore } from '@/store/user';
import { Settings } from 'lucide-react';

export default function LeftSidebar() {
	const { user } = useUserStore((state) => state);

	function canView(item: SidebarNavLinkType) {
		if (!user) return false;

		if (user.role === 'admin') return true;

		// If no permissions required, the role check is enough
		if (!item.permissions || item.permissions.length === 0) return true;

		const userPerms = user.rbacRole?.permissions ?? [];
		return item.permissions.some((p) => userPerms.includes(p));
	}

	return (
		<aside className='transition-all w-auto md:w-[200px] bg-card min-h-dvh flex flex-col gap-20 flex-shrink-0 justify-between p-5 text-sm text-muted-foreground'>
			<div className='flex flex-col justify-between gap-5'>
				<HeaderLogo />
				{navbarLinks
					.filter((item) => canView(item))
					.map((link) => (
						<SidebarLink key={link.name} link={link} />
					))}
			</div>

			<div className='flex flex-col justify-between gap-3'>
				<SidebarLink
					link={{ icon: Settings, name: 'Settings', path: '/settings' }}
				/>
				<DarkModeToggle text='Toggle Theme' />
				<LogoutButton />
			</div>
		</aside>
	);
}
