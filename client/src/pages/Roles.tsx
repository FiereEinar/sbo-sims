import { RoleCard } from '@/components/role/RoleCard';
import { useTenantNavigate } from '../hooks/useTenantNavigate';
import axiosInstance from '@/api/axiosInstance';
import { AddRoleForm } from '@/components/forms/AddRoleForm';
import HasPermission from '@/components/HasPermission';
import BouncyLoading from '@/components/loading/BouncyLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import SettingsTabs from '@/components/SettingsTabs';
import StickyHeader from '@/components/StickyHeader';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { Role } from '@/types/role';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, ShieldOff } from 'lucide-react';

export default function Roles() {
  const navigate = useTenantNavigate();
  const { toast } = useToast();
  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.ROLES],
    queryFn: async (): Promise<Role[]> => {
      const { data } = await axiosInstance.get('/role');
      return data.data;
    },
  });

  if (error) {
    return <p>Session expired, login again</p>;
  }

  const onDelete = async (roleID: string) => {
    try {
      await axiosInstance.delete(`/role/${roleID}`);
      toast({
        title: 'Role deleted successfully',
      });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ROLES] });
    } catch (error: any) {
      console.error('Failed to delete role', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete role',
        description:
          error.message ??
          'A network error occured while trying to delete role',
      });
    }
  };

  return (
    <SidebarPageLayout>
      <div className="w-full space-y-6 mx-auto">
        <SettingsTabs />
        <StickyHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <KeyRound size={16} />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">Roles</h1>
              {roles && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {roles.length} role{roles.length !== 1 ? 's' : ''} defined
                </p>
              )}
            </div>
          </div>

          <HasPermission permissions={[MODULES.ROLE_CREATE]}>
            <AddRoleForm />
          </HasPermission>
        </StickyHeader>

        {isLoading && <BouncyLoading text="Loading roles" />}

        {!isLoading && roles && roles.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card/30 py-16 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ShieldOff size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">No roles yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a role to define what members can do.
              </p>
            </div>
          </div>
        )}

        {roles && roles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <RoleCard
                key={role._id}
                role={role}
                onEdit={() => navigate(`/role/${role._id}`)}
                onDelete={() => onDelete(role._id)}
              />
            ))}
          </div>
        )}
      </div>
    </SidebarPageLayout>
  );
}
