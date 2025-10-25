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
import { Category } from '@/types/category';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { Prelisting } from '@/types/prelisting';
import AddPrelistingForm from '../forms/AddPrelistingForm';
import { requestDeletePrelisting } from '@/api/prelisting';

type EditAndDeletePrelistingButtonProps = {
	prelisting: Prelisting;
	categories: Category[];
};

export default function EditAndDeletePrelistingButton({
	prelisting,
	categories,
}: EditAndDeletePrelistingButtonProps) {
	return (
		<div className='space-x-2 flex'>
			<EditButton prelisting={prelisting} categories={categories} />
			<DeleteButton prelistingID={prelisting._id} />
		</div>
	);
}

type DeleteButtonProps = {
	prelistingID: string;
};

function DeleteButton({ prelistingID }: DeleteButtonProps) {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onDelete = async () => {
		try {
			navigate('/prelisting');

			await requestDeletePrelisting(prelistingID);
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRELISTING] });
		} catch (err: any) {
			toast({
				title: 'Failed to delete prelisting',
				description:
					err.message ||
					'A network error occured while trying to delete prelisting',
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
						prelisting and remove your data from the database.
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

function EditButton({
	prelisting,
	categories,
}: EditAndDeletePrelistingButtonProps) {
	return (
		<AddPrelistingForm
			mode='edit'
			prelisting={prelisting}
			categories={categories}
		/>
	);
}
