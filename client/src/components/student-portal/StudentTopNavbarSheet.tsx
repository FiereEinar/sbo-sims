import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '../ui/button';
import GetIcon from '../icons/get-icon';
import { studentNavbarLinks } from '@/constants';
import HeaderLogo from '../HeaderLogo';
import DarkModeToggle from '../buttons/DarkModeToggle';
import LogoutButton from '../buttons/LogoutButton';
import { NavLink } from 'react-router-dom';
import { SidebarNavLinkType } from '@/constants';
import { Fragment } from 'react';

function StudentSidebarLink({ link }: { link: SidebarNavLinkType }) {
  return (
    <NavLink
      id={`student-nav-link-sheet-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
      title={link.name}
      to={link.path}
      end={link.path === '/student/dashboard'}
      className={({ isActive }) =>
        `hover:opacity-90 select-none flex items-center gap-2 ${
          isActive ? 'text-primary dark:text-primary' : 'text-muted-foreground'
        }`
      }
    >
      <link.icon className="size-5" />
      <span className="font-semibold">{link.name}</span>
    </NavLink>
  );
}

export default function StudentTopNavbarSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild className="w-fit">
        <Button size="sm" variant="ghost">
          <GetIcon iconKey="menu" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <HeaderLogo />
          <SheetTitle></SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>

        <div className="flex flex-col justify-between gap-5 mt-5">
          <hr />
          <div className="flex flex-col justify-between gap-4">
            {studentNavbarLinks.map((link, i) => (
              <Fragment key={`${link.name}-${i}`}>
                {link.isSeparator && <hr />}
                {link.title && (
                  <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground/60 px-1">
                    {link.title}
                  </p>
                )}
                <StudentSidebarLink link={link} />
              </Fragment>
            ))}
          </div>

          <hr />

          <div className="flex flex-col justify-between gap-3">
            <DarkModeToggle text="Toggle Theme" />
            <LogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
