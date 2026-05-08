import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, KeyRound, Trash, Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Role } from '@/types/role';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import HasPermission from './HasPermission';
import { MODULES } from '@/constants';

type RoleCardProps = {
	role?: Role;
	isLoading?: boolean;
	onEdit?: (role: Role) => void;
	onDelete?: (role: Role) => void;
};

export function RoleCard({ role, isLoading, onEdit, onDelete }: RoleCardProps) {
	if (isLoading) {
		return (
			<div className='rounded-2xl border bg-card/50 p-5 shadow-sm space-y-3'>
				<Skeleton className='h-10 w-10 rounded-xl' />
				<Skeleton className='h-5 w-32' />
				<Skeleton className='h-4 w-full' />
				<div className='flex gap-2'>
					<Skeleton className='h-6 w-16 rounded-full' />
					<Skeleton className='h-6 w-16 rounded-full' />
				</div>
			</div>
		);
	}

	if (!role) return null;

	const permissionCount = role.permissions.length;

	return (
		<div className='rounded-2xl border bg-card/50 p-5 shadow-sm flex flex-col hover:shadow-md transition h-full'>
			{/* Header */}
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<div className='rounded-xl bg-primary/10 p-2.5 text-primary'>
						<KeyRound className='size-5' />
					</div>
					<Badge variant='outline' className='text-xs'>
						{permissionCount} permission{permissionCount !== 1 ? 's' : ''}
					</Badge>
				</div>

				<div>
					<h3 className='text-lg font-semibold flex items-center gap-2'>
						<ShieldCheck className='size-4 text-primary' />
						{role.name}
					</h3>
					{role.description && (
						<p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
							{role.description}
						</p>
					)}
				</div>
			</div>

			{/* Permissions */}
			<div className='mt-4 flex-1'>
				<div className='flex flex-wrap gap-1.5'>
					{role.permissions.slice(0, 3).map((perm) => (
						<Badge key={perm} variant='secondary' className='text-xs'>
							{perm}
						</Badge>
					))}
					{permissionCount > 3 && (
						<Badge variant='outline' className='text-xs'>
							+{permissionCount - 3} more
						</Badge>
					)}
				</div>
			</div>

			{/* Footer Actions */}
			<div className='mt-4 pt-3 border-t flex justify-end gap-2'>
				<HasPermission permissions={[MODULES.ROLE_UPDATE]}>
					<Button size='sm' variant='outline' onClick={() => onEdit?.(role)}>
						<Edit2 className='size-3.5 mr-1' />
						Edit
					</Button>
				</HasPermission>

				<HasPermission permissions={[MODULES.ROLE_DELETE]}>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button size='sm' variant='outline' className='text-red-500'>
								<Trash className='size-3.5 mr-1' />
								Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete
									the role and remove it from the database.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={() => onDelete?.(role)}>
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</HasPermission>
			</div>
		</div>
	);
}

