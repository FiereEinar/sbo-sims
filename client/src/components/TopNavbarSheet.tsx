import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import GetIcon from './icons/get-icon';
import { navbarLinks } from '@/constants';
import SidebarLink from './SidebarLink';
import HeaderLogo from './HeaderLogo';
import DarkModeToggle from './buttons/DarkModeToggle';
import LogoutButton from './buttons/LogoutButton';

export default function TopNavbarSheet() {
	return (
		<Sheet>
			<SheetTrigger asChild className='w-fit'>
				<Button size='sm' variant='ghost'>
					<GetIcon iconKey='menu' />
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<HeaderLogo />
					<SheetTitle></SheetTitle>
					<SheetDescription></SheetDescription>
				</SheetHeader>

				<div className='flex flex-col justify-between gap-5'>
					<hr />
					<div className='flex flex-col justify-between gap-4'>
						{navbarLinks.map((link) => (
							<SidebarLink key={link.name} link={link} />
						))}
					</div>

					<hr />

					<div className='flex flex-col justify-between gap-3'>
						<SidebarLink
							link={{ icon: 'settings', name: 'Settings', path: '/settings' }}
						/>
						<DarkModeToggle text='Toggle Theme' />
						<LogoutButton />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
