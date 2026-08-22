import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { setNavigate } from '@/lib/navigate';
import { Shield, Building2, LogOut, LifeBuoy } from 'lucide-react';
import adminAxiosInstance from '@/api/adminAxiosInstance';
import { useUserStore } from '@/store/user';
import DarkModeToggle from '@/components/buttons/DarkModeToggle';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminApp() {
  const navigate = useNavigate();
  setNavigate(navigate);
  const { user } = useUserStore();
  const { toast } = useToast();
  const location = useLocation();

  const isOrgActive = location.pathname === '/admin' || location.pathname === '/admin/';
  const isSupportActive = location.pathname.startsWith('/admin/support');

  const handleLogout = async () => {
    try {
      await adminAxiosInstance.get('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    // Stop the sync engine loop and clear stored credentials
    window.electronAPI?.clearSyncContext?.();
    navigate('/admin/login', { replace: true });
    toast({ title: 'Logged out', description: 'You have been signed out of the admin portal.' });
  };

  return (
    <div className="min-h-dvh flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col justify-between py-8 px-5 bg-card/40 border-r border-border/50">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-foreground">Super Admin</p>
              <p className="text-xs text-muted-foreground">SBO-SIMS Portal</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1">
            <button
              id="adminNavOrganizations"
              onClick={() => navigate('/admin')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isOrgActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Building2 className="w-4 h-4" />
              Organizations
            </button>
            <button
              id="adminNavSupport"
              onClick={() => navigate('/admin/support')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-2',
                isSupportActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <LifeBuoy className="w-4 h-4" />
              Support Tickets
            </button>
            <button
              id="adminNavSettings"
              onClick={() => navigate('/admin/settings')}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-2',
                location.pathname === '/admin/settings'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Shield className="w-4 h-4" />
              Global Settings
            </button>
          </nav>
        </div>

        {/* Bottom: user + logout */}
        <div className="space-y-3">
          <div className="px-3 py-3 rounded-xl bg-card border border-border/50">
            <p className="text-xs font-semibold truncate text-foreground">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-xs mt-0.5 text-muted-foreground">Global Administrator</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="adminLogout"
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
            <div className="py-2.5 px-2 rounded-xl bg-card border border-border/50">
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto h-dvh relative">
        <Outlet />
      </main>
    </div>
  );
}
