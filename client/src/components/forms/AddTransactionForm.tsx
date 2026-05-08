import {
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
import { SelectContainer, SelectContainerItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ring } from 'ldrs';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

ring.register();

type AddTransactionFormProps = {
	categories?: Category[];
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
	const [category, setCategory] = useState<Category>();
	const [studentIdSearch, setStudentIdSearch] = useState('');
	const [openRecommendation, setOpenRecommendation] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const debouncedStudentIdSearch = useDebounce(studentIdSearch);
	const navigate = useNavigate();
	const { toast } = useToast();

	const { data: studentsFetchResult, isLoading: fetchingStudents } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, { search: debouncedStudentIdSearch }],
		queryFn: () => fetchStudents({ search: debouncedStudentIdSearch }, 1, 5),
	});

	const { data: latestTransactions, isLoading: fetchingTransactions } =
		useQuery({
			queryKey: [QUERY_KEYS.TRANSACTION, { page: 1, pageSize: 5 }],
			queryFn: () => fetchTransactions({}, 1, 5),
		});

	const latestRecordedStudents = latestTransactions?.data
		.map((transaction) => transaction.owner)
		.filter((student, index, self) => {
			return self.indexOf(student) === index;
		});

	const {
		register,
		handleSubmit,
		setValue,
		getValues,
		setError,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionSchema),
		defaultValues: {
			modeOfPayment: 'cash',
		},
	});

	useEffect(() => {
		if (transaction) {
			setDate(new Date(transaction.date));
			setCategory(transaction.category);

			setValue('amount', transaction.amount.toString());
			setValue('studentID', transaction.owner.studentID);
			setValue('description', transaction.description);

			transaction.category?.details?.forEach((detail) => {
				if (!transaction.details) return;
				setValue(`details.${detail}`, transaction.details?.[detail]);
			});
			if (transaction.modeOfPayment) {
				setValue('modeOfPayment', transaction.modeOfPayment);
			}
		}
	}, [transaction, setValue]);

	// TODO: create another input field for time
	const onSubmit = async (data: TransactionFormValues) => {
		try {
			if (!category) {
				setError('categoryID', { message: 'Pick a category' });
				return;
			}
			setIsLoading(true);

			data.date = date?.toISOString();
			data.categoryID = category._id;

			reset({
				studentID: '',
			});

			await new Promise((resolve) => setTimeout(resolve, 5000)); // simulate loading

			if (transaction && mode === 'edit')
				await submitUpdateTransactionForm(transaction._id, data);
			else if (mode === 'add') await submitTransactionForm(data);

			toast({
				title: `Transaction ${mode === 'add' ? 'added' : 'updated'} successfully`,
			});
			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.TRANSACTION],
			});
			navigate(`/transaction/${transaction?._id ?? ''}`, { replace: true });
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit transaction',
			});
		} finally {
			setIsLoading(false);
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

					<div
						onClick={() => setOpenRecommendation(!openRecommendation)}
						className='relative'
					>
						{(fetchingStudents || fetchingTransactions) && (
							<div className='absolute top-[55%] right-2'>
								<l-ring
									size='20'
									stroke='3'
									bg-opacity='0'
									speed='2'
									color='#DDDDDD'
								></l-ring>
							</div>
						)}
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
							{/* search results */}
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
							{/* recommended students based on record time */}
							{latestRecordedStudents &&
								!studentIdSearch &&
								openRecommendation && (
									<SelectContainer>
										<div className='px-2 py-1 text-xs text-muted-foreground'>
											Recommended based on recent records:
										</div>
										{latestRecordedStudents.map((student, i) => (
											<SelectContainerItem
												type='button'
												onClick={() => {
													setValue('studentID', student.studentID);
													setStudentIdSearch('');
												}}
												key={`${student._id}-${i}`}
											>
												{student.studentID} -{' '}
												{_.startCase(
													`${student.firstname} ${student.lastname}`,
												)}
											</SelectContainerItem>
										))}
									</SelectContainer>
								)}
						</div>
					</div>

					<div className='flex flex-col gap-1.5'>
						<label htmlFor='modeOfPayment' className='text-sm'>Mode of Payment:</label>
						<Controller
							control={control}
							name='modeOfPayment'
							render={({ field }) => (
								<Select onValueChange={field.onChange} defaultValue={field.value}>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Select mode of payment' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='cash'>Cash</SelectItem>
										<SelectItem value='gcash'>GCash</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
						{errors.modeOfPayment && (
							<ErrorText>{errors.modeOfPayment.message?.toString()}</ErrorText>
						)}
					</div>

					<DatePicker
						date={date}
						setDate={setDate}
						error={errors.date?.message?.toString()}
						note='(Defaults to now when empty)'
					/>

					<CategoryPicker
						defaultValue={category?._id ?? ''}
						categories={categories || []}
						setCategory={setCategory}
						error={errors.categoryID?.message?.toString()}
					/>

					<div className='grid grid-cols-2 gap-2'>
						{category &&
							category.details.map((detail, i) => (
								<InputField<TransactionFormValues>
									key={i}
									name={`details.${detail}`}
									type='text'
									registerFn={register}
									errors={errors}
									label={_.startCase(`${detail}`) + ':'}
									id={`details.${detail}`}
								/>
							))}
					</div>

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
						<Button
							className=''
							disabled={isSubmitting || isLoading}
							type='submit'
						>
							Submit
						</Button>
					</div>
				</form>

				<DialogFooter></DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
