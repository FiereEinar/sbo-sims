import { NavLink } from 'react-router-dom';
import GetIcon, { iconKeys } from './icons/get-icon';

type SidebarLinkProps = {
	link: {
		path: string;
		name: string;
		icon: string;
	};
};

export default function SidebarLink({ link }: SidebarLinkProps) {
	return (
		<NavLink
			title={link.name}
			to={link.path}
			className={({ isActive }) =>
				`hover:opacity-90 ${isActive ? 'text-primary1 active-link' : ''}`
			}
		>
			<div className='flex items-center gap-1'>
				<GetIcon iconKey={link.icon as iconKeys} />
				<p className=''>{link.name}</p>
			</div>
		</NavLink>
	);
}
