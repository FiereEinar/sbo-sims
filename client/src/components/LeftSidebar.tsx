import { navbarLinks, SidebarNavLinkType, MODULES } from '@/constants';
import DarkModeToggle from './buttons/DarkModeToggle';
import SidebarLink from './SidebarLink';
import SidebarGroup from './SidebarGroup';
import LogoutButton from './buttons/LogoutButton';
import HeaderLogo from './HeaderLogo';
import { useUserStore } from '@/store/user';
import { Settings } from 'lucide-react';
import { Fragment } from 'react';

export default function LeftSidebar() {
  const { user } = useUserStore((state) => state);

  function canView(item: SidebarNavLinkType) {
    if (!user) return false;

    if (user.role === 'central-admin') return true;

    // If no permissions required, the role check is enough
    if (!item.permissions || item.permissions.length === 0) return true;

    const userPerms = user.rbacRole?.permissions ?? [];
    return item.permissions.some((p) => userPerms.includes(p));
  }

  return (
    <aside className="transition-all w-auto md:w-[200px] bg-[#F6F6F6] dark:bg-[#121212] border-r h-dvh flex flex-col flex-shrink-0 text-sm text-muted-foreground overflow-auto">
      <HeaderLogo />
      <div className="flex flex-col h-full justify-between gap-5 p-5">
        <div className="flex flex-col gap-5">
          {navbarLinks
            .filter((item) => canView(item))
            .map((link, i) => (
              <Fragment key={`${link.name}-${i}`}>
                {link.isSeparator && <hr className="border-border/60 -mx-5" />}
                {link.title && (
                  <p className="text-[0.7rem] text-muted-foreground">
                    {link.title}
                  </p>
                )}
                {link.children ? (
                  <SidebarGroup link={link} />
                ) : (
                  <SidebarLink link={link} />
                )}
              </Fragment>
            ))}
        </div>

        <div className="flex flex-col gap-5 pt-5 border-t border-border/50">
          {canView({
            name: 'Settings',
            path: '/settings',
            icon: Settings,
            permissions: [MODULES.SETTING_READ],
          }) && (
            <SidebarLink
              link={{ icon: Settings, name: 'Settings', path: '/settings' }}
            />
          )}
          <DarkModeToggle text="Toggle Theme" />
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
