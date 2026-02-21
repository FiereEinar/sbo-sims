import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
import { queryClient } from '@/main';
import { MODULES, QUERY_KEYS } from '@/constants';
import AddOrganizationForm from '../forms/AddOrganizationForm';
import { requestDeleteOrganization } from '@/api/organization';
import HasPermission from '../HasPermission';

type EditAndDeleteOrganizationButtonProps = {
	organizationID: string;
};

export default function EditAndDeleteOrganizationButton({
	organizationID,
}: EditAndDeleteOrganizationButtonProps) {
	return (
		<div className='space-x-2 flex'>
			<HasPermission permissions={[MODULES.ORGANIZATION_UPDATE]}>
				<EditButton organizationID={organizationID} />
			</HasPermission>
			<HasPermission permissions={[MODULES.ORGANIZATION_DELETE]}>
				<DeleteButton organizationID={organizationID} />
			</HasPermission>
		</div>
	);
}

type DeleteButtonProps = {
	organizationID: string;
};

function DeleteButton({ organizationID }: DeleteButtonProps) {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onDelete = async () => {
		try {
			navigate('/organization');

			await requestDeleteOrganization(organizationID);
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGANIZATION] });
		} catch (err: any) {
			console.error('Failed to delete organization', err);
			toast({
				variant: 'destructive',
				title: 'Failed to delete organization',
				description:
					err.message ||
					'A network error occured while trying to delete organization',
			});
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button className='flex gap-1' variant='destructive' size='sm'>
					<img src='/icons/delete.svg' className='size-5' alt='' />
					<p>Delete</p>
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the
						organization and remove the data from the database.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function EditButton({ organizationID }: EditAndDeleteOrganizationButtonProps) {
	return <AddOrganizationForm mode='edit' organizationID={organizationID} />;
}
