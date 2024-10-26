import { Transaction } from '@/types/transaction';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { requestDeleteTransaction } from '@/api/transaction';
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
import AddTransactionForm from '../forms/AddTransactionForm';
import { Category } from '@/types/category';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';

type EditAndDeleteTransactionButtonProps = {
	transaction: Transaction;
	categories: Category[];
};

export default function EditAndDeleteTransactionButton({
	transaction,
	categories,
}: EditAndDeleteTransactionButtonProps) {
	return (
		<div className='space-x-2 flex'>
			<EditButton transaction={transaction} categories={categories} />
			<DeleteButton transactionID={transaction._id} />
		</div>
	);
}

type DeleteButtonProps = {
	transactionID: string;
};

function DeleteButton({ transactionID }: DeleteButtonProps) {
	const { toast } = useToast();
	const navigate = useNavigate();

	const onDelete = async () => {
		try {
			const result = await requestDeleteTransaction(transactionID);

			if (!result) {
				toast({
					title: 'Failed to delete transaction',
					description:
						'A network error occured while trying to delete transaction',
				});
				return;
			}

			if (!result.success) {
				toast({
					title: 'Failed to delete transaction',
					description: `${result.message} ${result.error ?? ''}`,
				});
				return;
			}

			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTION] });
			navigate('/transaction');
		} catch (err: any) {
			toast({
				title: 'Failed to delete transaction',
				description:
					'A network error occured while trying to delete transaction',
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
						transaction and remove your data from the database.
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
	transaction,
	categories,
}: EditAndDeleteTransactionButtonProps) {
	return (
		<AddTransactionForm
			mode='edit'
			transaction={transaction}
			categories={categories}
		/>
	);
}
