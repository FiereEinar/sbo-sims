import { studentNavbarLinks } from '@/constants';
import DarkModeToggle from '../buttons/DarkModeToggle';
import LogoutButton from '../buttons/LogoutButton';
import HeaderLogo from '../HeaderLogo';
import { NavLink } from 'react-router-dom';
import { Fragment } from 'react';
import { SidebarNavLinkType } from '@/constants';

function StudentSidebarLink({ link }: { link: SidebarNavLinkType }) {
  return (
    <NavLink
      id={`student-nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
      title={link.name}
      to={link.path}
      end={link.path === '/student/dashboard'}
      className={({ isActive }) =>
        `hover:opacity-90 select-none ${
          isActive ? 'text-primary dark:text-primary' : ''
        }`
      }
    >
      <div className="flex items-center justify-start sm:justify-center md:justify-start gap-2">
        <link.icon className="size-5" />
        <p className="flex sm:hidden md:flex font-semibold">{link.name}</p>
      </div>
    </NavLink>
  );
}

export default function StudentLeftSidebar() {
  return (
    <aside className="transition-all w-auto md:w-[200px] bg-[#F6F6F6] dark:bg-[#121212] border-r h-dvh flex flex-col flex-shrink-0 text-sm text-muted-foreground overflow-auto">
      <HeaderLogo />

      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col justify-between gap-5 p-5">
          {studentNavbarLinks.map((link, i) => (
            <Fragment key={`${link.name}-${i}`}>
              {link.isSeparator && <hr className="border-border/60 -mx-5" />}
              {link.title && (
                <p className="text-[0.7rem] text-muted-foreground">
                  {link.title}
                </p>
              )}
              <StudentSidebarLink link={link} />
            </Fragment>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-3 p-5 mt-10">
          <DarkModeToggle text="Toggle Theme" />
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
