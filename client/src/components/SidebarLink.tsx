import { NavLink, useParams } from 'react-router-dom';
import { SidebarNavLinkType } from '@/constants';

type SidebarLinkProps = {
	link: SidebarNavLinkType;
};

export default function SidebarLink({ link }: SidebarLinkProps) {
	const { orgSlug } = useParams<{ orgSlug: string }>();

	let resolvedPath = link.path;
	if (orgSlug) {
		const cleanPath = link.path.startsWith('/') ? link.path.substring(1) : link.path;
		// If it's the dashboard route ('/'), avoid trailing slash when combining
		resolvedPath = cleanPath ? `/${orgSlug}/${cleanPath}` : `/${orgSlug}`;
	}

	return (
		<NavLink
			title={link.name}
			to={resolvedPath}
			end={link.path === '/'}
			className={({ isActive }) =>
				`hover:opacity-90 select-none ${
					isActive ? 'text-primary dark:text-primary' : ''
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
