import axiosInstance from '@/api/axiosInstance';
import { AddRoleForm } from '@/components/forms/AddRoleForm';
import HasPermission from '@/components/HasPermission';
import BouncyLoading from '@/components/loading/BouncyLoading';
import { RoleCard } from '@/components/RoleCard';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/main';
import { Role } from '@/types/role';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export default function Roles() {
	const navigate = useNavigate();
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
			<StickyHeader>
				<Header>Roles</Header>

				<HasPermission permissions={[MODULES.ROLE_CREATE]}>
					<AddRoleForm />
				</HasPermission>
			</StickyHeader>
			{isLoading && <BouncyLoading text='Loading roles' />}
			<div className='space-y-2'>
				{roles && roles.length === 0 && (
					<p className='italic text-muted-foreground'>No roles found</p>
				)}
				{roles &&
					roles.map((role) => (
						<RoleCard
							key={role._id}
							role={role}
							onEdit={() => navigate(`/role/${role._id}`)}
							onDelete={() => onDelete(role._id)}
						/>
					))}
			</div>
		</SidebarPageLayout>
	);
}
