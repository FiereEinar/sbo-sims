import {
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
import { SelectContainer, SelectContainerItem } from '../ui/select';

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

	const { data: studentsFetchResult } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, { search: debouncedStudentIdSearch }],
		queryFn: () => fetchStudents({ search: debouncedStudentIdSearch }, 1, 5),
	});

	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionSchema),
	});

	useEffect(() => {
		if (transaction) {
			setDate(new Date(transaction.date));
			setCategory(transaction.category._id);

			setValue('amount', transaction.amount.toString());
			setValue('studentID', transaction.owner.studentID);
			setValue('description', transaction.description);
		}
	}, [transaction, setValue]);

	// TODO: create another input field for time
	const onSubmit = async (data: TransactionFormValues) => {
		try {
			if (!category) {
				setError('categoryID', { message: 'Pick a category' });
				return;
			}

			data.date = date?.toISOString();
			data.categoryID = category;

			if (transaction && mode === 'edit')
				await submitUpdateTransactionForm(transaction._id, data);
			else if (mode === 'add') await submitTransactionForm(data);

			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTION] });
			navigate(`/transaction/${transaction?._id ?? ''}`, { replace: true });
			reset();
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit transaction',
			});
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
							onChange={() => {
								setValue('studentID', getValues('studentID'));
								setStudentIdSearch(getValues('studentID'));
							}}
						/>
						<div className='relative w-full'>
							{studentsFetchResult && studentIdSearch && (
								<SelectContainer>
									{studentsFetchResult.data.map((student) => (
										<SelectContainerItem
											type='button'
											onClick={() => {
												setValue('studentID', student.studentID);
												setStudentIdSearch('');
											}}
											key={student._id}
										>
											{student.studentID} -{' '}
											{_.startCase(`${student.firstname} ${student.lastname}`)}
										</SelectContainerItem>
									))}
								</SelectContainer>
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
