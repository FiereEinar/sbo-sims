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
		<div className='rounded-2xl border bg-card/50 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition'>
			{/* Top Section */}
			<div className='space-y-2'>
				<div className='flex justify-between items-start'>
					<div>
						<p className='text-xs text-muted-foreground uppercase tracking-wide'>
							Role
						</p>
						<h3 className='text-xl font-semibold flex items-center gap-2'>
							<ShieldCheck className='size-5 text-primary' />
							{role.name}
						</h3>
					</div>

					<div className='rounded-xl bg-primary/10 p-2 text-primary'>
						<KeyRound className='size-5' />
					</div>
				</div>

				{role.description && (
					<p className='text-sm text-muted-foreground'>{role.description}</p>
				)}
			</div>

			<div className='flex justify-between items-start'>
				{/* Permission Summary */}
				<div className='mt-4 space-y-2'>
					<p className='text-xs text-muted-foreground uppercase tracking-wide'>
						Permissions
					</p>

					<div className='flex flex-wrap gap-2'>
						{role.permissions.slice(0, 4).map((perm) => (
							<Badge key={perm} variant='secondary'>
								{perm}
							</Badge>
						))}

						{permissionCount > 4 && (
							<Badge variant='outline'>+{permissionCount - 4} more</Badge>
						)}
					</div>
				</div>

				{/* Footer Actions */}
				<div className='mt-4 flex justify-end gap-2'>
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
										the transaction and remove your data from the database.
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
		</div>
	);
}
