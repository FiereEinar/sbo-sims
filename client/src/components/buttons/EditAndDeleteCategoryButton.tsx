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
import { Category } from '@/types/category';
import AddCategoryForm from '../forms/AddCategoryForm';
import { requestDeleteCategory } from '@/api/category';
import HasPermission from '../HasPermission';

type EditAndDeleteCategoryButtonProps = {
	category: Category;
};

export default function EditAndDeleteCategoryButton({
	category,
}: EditAndDeleteCategoryButtonProps) {
	return (
		<div className='space-x-2 flex'>
			<HasPermission permissions={[MODULES.CATEGORY_UPDATE]}>
				<EditButton category={category} />
			</HasPermission>

			<HasPermission permissions={[MODULES.CATEGORY_DELETE]}>
				<DeleteButton categoryID={category._id} />
			</HasPermission>
		</div>
	);
}

type DeleteButtonProps = {
	categoryID: string;
};

function DeleteButton({ categoryID }: DeleteButtonProps) {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onDelete = async () => {
		try {
			navigate('/category');

			await requestDeleteCategory(categoryID);
			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
			});
		} catch (err: any) {
			console.error('Failed to delete category', err);
			toast({
				variant: 'destructive',
				title: 'Failed to delete category',
				description:
					err.message ||
					'A network error occured while trying to delete category',
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
						category and remove the data from the database.
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

function EditButton({ category }: EditAndDeleteCategoryButtonProps) {
	return <AddCategoryForm mode='edit' category={category} />;
}
