import { NavLink } from 'react-router-dom';
import { SidebarNavLinkType } from '@/constants';

type SidebarLinkProps = {
	link: SidebarNavLinkType;
};

export default function SidebarLink({ link }: SidebarLinkProps) {
	return (
		<NavLink
			title={link.name}
			to={link.path}
			className={({ isActive }) =>
				`hover:opacity-90 select-none ${
					isActive ? 'text-primary1 active-link' : ''
				}`
			}
		>
			<div className='flex items-center justify-start sm:justify-center md:justify-start gap-2'>
				<link.icon className='size-5' />
				<p className='flex sm:hidden md:flex'>{link.name}</p>
			</div>
		</NavLink>
	);
}
