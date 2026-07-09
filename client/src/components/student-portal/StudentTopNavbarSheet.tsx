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
import { Link, useLocation } from 'react-router-dom';
import HeaderLogo from '../HeaderLogo';
import DarkModeToggle from '../buttons/DarkModeToggle';
import LogoutButton from '../buttons/LogoutButton';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

function StudentSidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
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
          <div className="flex flex-col gap-2">
            <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              Student Portal
            </p>
            <StudentSidebarLink
              to="/student/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />
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
