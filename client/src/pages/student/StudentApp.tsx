import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '@/lib/navigate';
import DarkModeToggle from '@/components/buttons/DarkModeToggle';
import LogoutButton from '@/components/buttons/LogoutButton';
import HeaderLogo from '@/components/HeaderLogo';
import { LayoutDashboard } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import StudentTopNavbar from '@/components/student-portal/StudentTopNavbar';

function StudentSidebarLink({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
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
      <span className="hidden md:block">{label}</span>
    </Link>
  );
}

export default function StudentApp() {
  const navigate = useNavigate();
  setNavigate(navigate);

  return (
    <main className="transition-all bg-background flex h-dvh">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden sm:flex">
        <aside className="transition-all w-auto md:w-[200px] bg-[#F6F6F6] dark:bg-[#121212] border-r h-dvh flex flex-col flex-shrink-0 text-sm text-muted-foreground overflow-auto">
        <HeaderLogo />
        <div className="flex flex-col gap-2 p-4 flex-1">
          {/* Student portal label */}
          <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground/60 px-3 mb-1 hidden md:block">
            Student Portal
          </p>
          <StudentSidebarLink to="/student/dashboard" icon={LayoutDashboard} label="Dashboard" />
        </div>
        <div className="flex flex-col gap-3 p-5">
          <DarkModeToggle text="Toggle Theme" />
          <LogoutButton />
        </div>
      </aside>
      </div>

      {/* Main content */}
      <div className="overflow-hidden w-full">
        <div className="flex w-full">
          <StudentTopNavbar />
        </div>
        <div className="overflow-auto h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
