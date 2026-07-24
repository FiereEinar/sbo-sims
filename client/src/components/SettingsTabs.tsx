import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MODULES } from '@/constants';
import Header from '@/components/ui/header';
import { useUserStore } from '@/store/user';

export default function SettingsTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user } = useUserStore();

  const getPath = (path: string) => {
    return orgSlug ? `/${orgSlug}${path}` : path;
  };

  const tabs = [
    {
      name: 'General',
      path: '/settings',
      match: '/settings',
      permissions: [MODULES.SETTING_READ],
    },
    {
      name: 'Organization',
      path: '/organization',
      match: '/organization',
      permissions: [MODULES.ORGANIZATION_READ],
    },
    {
      name: 'Users',
      path: '/user',
      match: '/user',
      permissions: [MODULES.USER_READ],
    },
    {
      name: 'Roles',
      path: '/role',
      match: '/role',
      permissions: [MODULES.ROLE_READ],
    },
  ];

  const canView = (permissions: string[]) => {
    if (!user) return false;
    if (user.role === 'central-admin') return true;
    if (permissions.length === 0) return true;
    const userPerms = user.rbacRole?.permissions ?? [];
    return permissions.some((p) => userPerms.includes(p));
  };

  return (
    <div className="w-full space-y-6 mb-8">
      <div>
        <Header>Settings</Header>
        <p className="text-muted-foreground text-sm">
          Manage system configuration, organization details, and access control.
        </p>
      </div>

      <div className="flex border-b border-border/50 overflow-x-auto">
        {tabs
          .filter((tab) => canView(tab.permissions))
          .map((tab) => {
            const isActive = location.pathname.includes(getPath(tab.match));
            return (
              <button
                key={tab.name}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => navigate(getPath(tab.path))}
              >
                {tab.name}
              </button>
            );
          })}
      </div>
    </div>
  );
}
