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
import { navbarLinks, MODULES, SidebarNavLinkType } from '@/constants';
import { useUserStore } from '@/store/user';
import SidebarLink from './SidebarLink';
import MobileSidebarGroup from './MobileSidebarGroup';
import HeaderLogo from './HeaderLogo';
import DarkModeToggle from './buttons/DarkModeToggle';
import LogoutButton from './buttons/LogoutButton';
import { Settings } from 'lucide-react';
import { Fragment } from 'react';

export default function TopNavbarSheet() {
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
    <Sheet>
      <SheetTrigger asChild className="w-fit">
        <Button size="sm" variant="ghost">
          <GetIcon iconKey="menu" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <HeaderLogo />
          <SheetTitle></SheetTitle>
          <SheetDescription></SheetDescription>
        </SheetHeader>

        <div className="flex flex-col justify-between gap-5 overflow-y-auto h-full pb-10">
          <hr />
          <div className="flex flex-col justify-between gap-4">
            {navbarLinks
              .filter((item) => canView(item))
              .map((link, i) => (
                <Fragment key={`${link.name}-${i}`}>
                  {link.isSeparator && (
                    <hr className="border-border/60 -mx-5" />
                  )}
                  {link.title && (
                    <p className="text-[0.7rem] text-muted-foreground">
                      {link.title}
                    </p>
                  )}
                  {link.children ? (
                    <MobileSidebarGroup link={link} />
                  ) : (
                    <SidebarLink link={link} />
                  )}
                </Fragment>
              ))}
          </div>

          <hr />

          <div className="flex flex-col justify-between gap-3">
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
      </SheetContent>
    </Sheet>
  );
}
