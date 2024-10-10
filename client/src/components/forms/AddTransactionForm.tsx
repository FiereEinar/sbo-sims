import {
	fetchTransactionByID,
	fetchTransactions,
	submitTransactionForm,
	submitUpdateTransactionForm,
} from '@/api/transaction';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { DialogHeader, DialogFooter } from '../ui/dialog';
import { transactionSchema } from '@/lib/validations/transactionSchema';
import InputField from '../InputField';
import { useEffect, useState } from 'react';
import { Category } from '@/types/category';
import { z } from 'zod';
import DatePicker from '../DatePicker';
import CategoryPicker from '../CategoryPicker';
import Plus from '../icons/plus';
import { Transaction } from '@/types/transaction';
import { useNavigate } from 'react-router-dom';

type AddTransactionFormProps = {
	categories: Category[];
	mode?: 'edit' | 'add';
	transaction?: Transaction;
};

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function AddTransactionForm({
	categories,
	transaction,
	mode = 'add',
}: AddTransactionFormProps) {
	if (transaction === undefined && mode === 'edit') {
		throw new Error('No transaction data provided while form mode is on edit');
	}

	const [date, setDate] = useState<Date>();
	const [category, setCategory] = useState<string>();
	const navigate = useNavigate();

	const { refetch } = useQuery({
		queryKey: ['transactions'],
		queryFn: fetchTransactions,
	});

	const { refetch: tRefetch } = useQuery({
		queryKey: [`transaction_${transaction?._id}`],
		queryFn: () => fetchTransactionByID(transaction?._id ?? ''),
	});

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionSchema),
		defaultValues: {
			studentID: transaction?.owner.studentID ?? '',
			amount: transaction?.amount.toString() ?? '',
			description: transaction?.description ?? '',
		},
	});

	useEffect(() => {
		if (transaction) {
			setDate(new Date(transaction.date));
			setCategory(transaction.category._id);
		}
	}, [transaction]);

	// TODO: create another input field for time
	const onSubmit = async (data: TransactionFormValues) => {
		try {
			if (!category) {
				setError('categoryID', { message: 'Pick a category' });
				return;
			}

			if (date) {
				const now = new Date();
				data.date = date;
				data.date.setHours(now.getHours());
				data.date.setMinutes(now.getMinutes());
				data.date.setSeconds(now.getSeconds());
			}

			data.categoryID = category;

			let result;

			if (transaction && mode === 'edit')
				result = await submitUpdateTransactionForm(transaction._id, data);
			else if (mode === 'add') result = await submitTransactionForm(data);

			if (!result) {
				setError('root', {
					message: 'Something went wrong while trying to submit your form',
				});
				return;
			}

			if (!result.success) {
				setError('root', {
					message: `${result.message}\n${result.error ?? ''}`,
				});
				return;
			}

			mode === 'add' ? refetch() : tRefetch();
			navigate(`/transaction/${result.data._id ?? ''}`);
			reset();
		} catch (err: any) {
			setError('root', { message: 'Failed to submit transaction form' });
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				{mode === 'add' ? (
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add Transaction</p>
					</Button>
				) : (
					<Button className='flex gap-1' size='sm' variant='ocean'>
						<img src='/icons/edit.svg' className='size-5' alt='' />
						<p>Edit</p>
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>
						{mode === 'add' ? 'Add' : 'Edit'} Transaction
					</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<TransactionFormValues>
						name='amount'
						type='number'
						registerFn={register}
						errors={errors}
						label='Amount:'
						id='amount'
					/>

					<InputField<TransactionFormValues>
						name='studentID'
						registerFn={register}
						errors={errors}
						label='Student ID:'
						id='studentID'
					/>

					<DatePicker
						date={date}
						setDate={setDate}
						error={errors.date?.message?.toString()}
					/>

					<CategoryPicker
						defaultValue={category}
						categories={categories}
						setCategory={setCategory}
						error={errors.categoryID?.message?.toString()}
					/>

					<InputField<TransactionFormValues>
						name='description'
						registerFn={register}
						errors={errors}
						label='Description(optional):'
						id='description'
					/>

					{errors.root && errors.root.message && (
						<p className='text-xs text-destructive'>
							{errors.root.message.toString()}
						</p>
					)}

					<div className='flex justify-end'>
						<Button className='' disabled={isSubmitting} type='submit'>
							Submit
						</Button>
					</div>
				</form>

				<DialogFooter></DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
