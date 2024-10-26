import {
	fetchTransactionByID,
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
import ErrorText from '../ui/error-text';
import { fetchStudents } from '@/api/student';
import _ from 'lodash';
import { useDebounce } from '@/hooks/useDebounce';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';

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
	const [studentIdSearch, setStudentIdSearch] = useState('');
	const debouncedStudentIdSearch = useDebounce(studentIdSearch);
	const navigate = useNavigate();

	const { data: transactionData } = useQuery({
		queryKey: [QUERY_KEYS.TRANSACTION, { transactionID: transaction?._id }],
		queryFn: () => fetchTransactionByID(transaction?._id),
	});

	const { data: studentsFetchResult } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, { search: debouncedStudentIdSearch }],
		queryFn: () => fetchStudents({ search: debouncedStudentIdSearch }, 1, 5),
	});

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionSchema),
	});

	useEffect(() => {
		if (transactionData) {
			setDate(new Date(transactionData.date));
			setCategory(transactionData.category._id);

			setValue('amount', transactionData.amount.toString());
			setValue('studentID', transactionData.owner.studentID);
			setValue('description', transactionData.description);
		}
	}, [transactionData, setValue]);

	// TODO: create another input field for time
	const onSubmit = async (data: TransactionFormValues) => {
		try {
			if (!category) {
				setError('categoryID', { message: 'Pick a category' });
				return;
			}

			data.date = date?.toISOString();
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

			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTION] });
			navigate(`/transaction/${transaction?._id ?? ''}`, { replace: true });
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

					<div>
						<InputField<TransactionFormValues>
							name='studentID'
							registerFn={register}
							errors={errors}
							label='Student ID:'
							autoComplete={false}
							id='studentID'
							onChange={(e) => {
								setValue('studentID', e.target.value);
								setStudentIdSearch(e.target.value);
							}}
						/>
						<div className='relative w-full'>
							{studentsFetchResult && studentIdSearch && (
								<div className='absolute w-full p-1 z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'>
									{studentsFetchResult.data.map((student) => (
										<button
											type='button'
											onClick={() => {
												setValue('studentID', student.studentID);
												setStudentIdSearch('');
											}}
											key={student._id}
											className='transition-all cursor-pointer hover:bg-card flex w-full select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
										>
											{student.studentID} -{' '}
											{_.startCase(`${student.firstname} ${student.lastname}`)}
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					<DatePicker
						date={date}
						setDate={setDate}
						error={errors.date?.message?.toString()}
						note='(Defaults to now when empty)'
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
						<ErrorText>{errors.root.message.toString()}</ErrorText>
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
