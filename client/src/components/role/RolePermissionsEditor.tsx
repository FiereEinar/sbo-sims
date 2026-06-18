import { Role } from '@/types/role';
import { MODULES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { submitUpdateRolePermissions } from '@/api/role';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';

type Props = {
	role: Role;
};

function groupPermissions() {
	const grouped: Record<string, string[]> = {};

	Object.values(MODULES).forEach((permission) => {
		const [module] = permission.split(':');

		if (!grouped[module]) {
			grouped[module] = [];
		}

		grouped[module].push(permission);
	});

	return grouped;
}

export function RolePermissionsEditor({ role }: Props) {
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();
	const groupedPermissions = groupPermissions();

	const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
		role.permissions,
	);

	const togglePermission = (permission: string) => {
		setSelectedPermissions((prev) =>
			prev.includes(permission)
				? prev.filter((p) => p !== permission)
				: [...prev, permission],
		);
	};

	const handleSave = async () => {
		try {
			setIsLoading(true);

			await submitUpdateRolePermissions(role._id, {
				permissions: selectedPermissions,
			});

			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.ROLES],
			});

			toast({ title: 'Permissions updated successfully!' });
		} catch (error) {
			toast({ title: 'Failed to update permissions', variant: 'destructive' });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='rounded-2xl border bg-card/50 p-6 shadow-sm space-y-6'>
			<div>
				<h2 className='text-xl font-semibold'>Permissions</h2>
				<p className='text-sm text-muted-foreground'>
					Manage access control for this role.
				</p>
			</div>

			{Object.entries(groupedPermissions).map(([module, permissions]) => (
				<div key={module} className='space-y-3'>
					<h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
						{module}
					</h3>

					<div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
						{permissions.map((permission) => (
							<div key={permission} className='flex items-center space-x-2'>
								<Checkbox
									id={permission}
									checked={selectedPermissions.includes(permission)}
									onCheckedChange={() => togglePermission(permission)}
								/>
								<label htmlFor={permission} className='text-sm capitalize'>
									{permission.split(':')[1]}
								</label>
							</div>
						))}
					</div>
				</div>
			))}

			<div className='flex justify-end'>
				<Button onClick={handleSave} disabled={isLoading}>
					Save Permissions
				</Button>
			</div>
		</div>
	);
}
