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
import { QUERY_KEYS } from '@/constants';
import AddOrganizationForm from '../forms/AddOrganizationForm';
import { requestDeleteOrganization } from '@/api/organization';

type EditAndDeleteOrganizationButtonProps = {
	organizationID: string;
};

export default function EditAndDeleteOrganizationButton({
	organizationID,
}: EditAndDeleteOrganizationButtonProps) {
	return (
		<div className='space-x-2 flex'>
			<EditButton organizationID={organizationID} />
			<DeleteButton organizationID={organizationID} />
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
			const result = await requestDeleteOrganization(organizationID);

			if (!result) {
				toast({
					variant: 'destructive',
					title: 'Failed to delete organization',
					description:
						'A network error occured while trying to delete organization',
				});
				return;
			}

			if (!result.success) {
				toast({
					variant: 'destructive',
					title: 'Failed to delete organization',
					description: `${result.message}. ${result.error ?? ''}`,
				});
				return;
			}

			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORGANIZATION] });
			navigate('/organization');
		} catch (err: any) {
			console.error('Failed to delete organization', err);
			toast({
				variant: 'destructive',
				title: 'Failed to delete organization',
				description:
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
