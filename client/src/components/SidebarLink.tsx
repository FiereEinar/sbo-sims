import { NavLink } from 'react-router-dom';
import GetIcon, { iconKeys } from './icons/get-icon';

type SidebarLinkProps = {
	link: {
		path: string;
		name: string;
		icon: iconKeys | string;
	};
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
			<div className='flex items-center justify-start sm:justify-center md:justify-start gap-1'>
				<GetIcon iconKey={link.icon as iconKeys} />
				<p className='flex sm:hidden md:flex'>{link.name}</p>
			</div>
		</NavLink>
	);
}
