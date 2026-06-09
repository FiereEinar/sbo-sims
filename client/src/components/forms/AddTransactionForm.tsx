import {
	fetchTransactions,
	submitBatchTransactionForm,
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
import { transactionSchema, batchTransactionSchema, addModeFormSchema } from '@/lib/validations/transactionSchema';
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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Trash2 , Pencil} from 'lucide-react';

ring.register();

type AddTransactionFormProps = {
	categories?: Category[];
	mode?: 'edit' | 'add';
	transaction?: Transaction;
};

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type BatchTransactionFormValues = z.infer<typeof batchTransactionSchema>;
export type AddModeFormValues = z.infer<typeof addModeFormSchema>;

type CategoryEntry = {
	id: string; // unique key for React
	category?: Category;
	amount: string;
	details: { [key: string]: string };
};

export default function AddTransactionForm({
	categories,
	transaction,
	mode = 'add',
}: AddTransactionFormProps) {
	if (transaction === undefined && mode === 'edit') {
		throw new Error('No transaction data provided while form mode is on edit');
	}

	// ── Shared state ──────────────────────────────────
	const [date, setDate] = useState<Date>();
	const [studentIdSearch, setStudentIdSearch] = useState('');
	const [openRecommendation, setOpenRecommendation] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const debouncedStudentIdSearch = useDebounce(studentIdSearch);
	const navigate = useNavigate();
	const { toast } = useToast();

	// ── Edit-mode single category state ───────────────
	const [category, setCategory] = useState<Category>();

	// ── Add-mode batch state ──────────────────────────
	const [categoryEntries, setCategoryEntries] = useState<CategoryEntry[]>([
		{ id: crypto.randomUUID(), category: undefined, amount: '', details: {} },
	]);

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
	} = useForm<any>({
		resolver: zodResolver(mode === 'edit' ? transactionSchema : addModeFormSchema),
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

	// ── Batch entry helpers ───────────────────────────
	const addCategoryEntry = () => {
		setCategoryEntries((prev) => [
			...prev,
			{ id: crypto.randomUUID(), category: undefined, amount: '', details: {} },
		]);
	};

	const removeCategoryEntry = (id: string) => {
		setCategoryEntries((prev) => prev.filter((e) => e.id !== id));
	};

	const updateEntry = (id: string, updates: Partial<CategoryEntry>) => {
		setCategoryEntries((prev) =>
			prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
		);
	};

	// ── Submit handlers ───────────────────────────────
	const onSubmitEdit = async (data: TransactionFormValues) => {
		try {
			if (!category) {
				setError('categoryID', { message: 'Pick a category' });
				return;
			}
			setIsLoading(true);

			data.date = date?.toISOString();
			data.categoryID = category._id;

			if (transaction && mode === 'edit')
				await submitUpdateTransactionForm(transaction._id, data);

			toast({ title: 'Transaction updated successfully' });
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

	const onSubmitBatch = async (data: TransactionFormValues) => {
		try {
			// Validate all entries have a category selected
			const invalidEntry = categoryEntries.find((e) => !e.category);
			if (invalidEntry) {
				setError('root', { message: 'Please select a category for all entries' });
				return;
			}

			const invalidAmount = categoryEntries.find(
				(e) => !e.amount || parseInt(e.amount) <= 0
			);
			if (invalidAmount) {
				setError('root', { message: 'Please enter a valid amount for all entries' });
				return;
			}

			setIsLoading(true);

			const batchData: BatchTransactionFormValues = {
				studentID: data.studentID,
				date: date?.toISOString(),
				description: data.description,
				modeOfPayment: data.modeOfPayment,
				items: categoryEntries.map((entry) => ({
					categoryID: entry.category!._id,
					amount: entry.amount,
					details: entry.details,
				})),
			};

			await submitBatchTransactionForm(batchData);

			reset({ studentID: '', modeOfPayment: 'cash' });

			toast({
				title: `${categoryEntries.length} transaction(s) added successfully`,
			});
			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.TRANSACTION],
			});

			// Reset entries
			setCategoryEntries([
				{ id: crypto.randomUUID(), category: undefined, amount: '', details: {} },
			]);
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit transactions',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const onSubmit = mode === 'edit' ? onSubmitEdit : onSubmitBatch;

	return (
		<Dialog>
			<DialogTrigger asChild>
				{mode === 'add' ? (
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add Transaction</p>
					</Button>
				) : (
					<Button className='flex gap-1' size='sm' variant='outline'>
						<Pencil className='size-4' />
						<p>Edit</p>
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className='sm:max-w-[500px] max-h-[85vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>
						{mode === 'add' ? 'Add' : 'Edit'} Transaction
					</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					{/* ── Student ID (shared) ────────────────── */}
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

					{/* ── Mode of Payment (shared) ────────────── */}
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

					{/* ── Date (shared) ────────────────────── */}
					<DatePicker
						date={date}
						setDate={setDate}
						error={errors.date?.message?.toString()}
						note='(Defaults to now when empty)'
					/>

					{/* ── EDIT MODE: single category ─────────── */}
					{mode === 'edit' && (
						<>
							<InputField<TransactionFormValues>
								name='amount'
								type='number'
								registerFn={register}
								errors={errors}
								label='Amount:'
								id='amount'
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
						</>
					)}

					{/* ── ADD MODE: multi-category entries ────── */}
					{mode === 'add' && (
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<Label className='text-sm font-medium'>Categories</Label>
								<Button
									type='button'
									variant='outline'
									size='sm'
									className='h-7 text-xs text-dark dark:text-white'
									onClick={addCategoryEntry}
								>
									<Plus /> Add Category
								</Button>
							</div>

							{categoryEntries.map((entry, index) => (
								<div
									key={entry.id}
									className='border rounded-lg p-3 space-y-2 bg-card/30'
								>
									<div className='flex items-center justify-between'>
										<span className='text-xs text-muted-foreground font-medium'>
											Entry #{index + 1}
										</span>
										{categoryEntries.length > 1 && (
											<Button
												type='button'
												variant='ghost'
												size='sm'
												className='h-6 w-6 p-0 text-destructive hover:text-destructive'
												onClick={() => removeCategoryEntry(entry.id)}
											>
												<Trash2 className='size-3.5' />
											</Button>
										)}
									</div>

									{/* Category picker for this entry */}
									<div className='text-muted-foreground space-y-1 select-none'>
										<Label>Category:</Label>
										<Select
											value={entry.category?._id ?? ''}
											onValueChange={(value) => {
												const cat = categories?.find((c) => c._id === value);
												updateEntry(entry.id, { category: cat, details: {} });
											}}
										>
											<SelectTrigger className='w-full'>
												<SelectValue placeholder='Select a category' />
											</SelectTrigger>
											<SelectContent>
												{(categories || []).map((cat) => (
													<SelectItem key={cat._id} value={cat._id}>
														{cat.organization.name}{' '}
														{cat.organization.name ? '-' : ''} {cat.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Amount for this entry */}
									<div className='space-y-1'>
										<Label className='text-sm'>
											Amount:
											{entry.category && (
												<span className='text-xs text-muted-foreground ml-1'>
													(Fee: ₱{entry.category.fee})
												</span>
											)}
										</Label>
										<Input
											type='number'
											placeholder='Enter amount'
											value={entry.amount}
											onChange={(e) =>
												updateEntry(entry.id, { amount: e.target.value })
											}
										/>
									</div>

									{/* Category-specific detail fields */}
									{entry.category && entry.category.details.length > 0 && (
										<div className='grid grid-cols-2 gap-2'>
											{entry.category.details.map((detail) => (
												<div key={detail} className='space-y-1'>
													<Label className='text-xs'>
														{_.startCase(detail)}:
													</Label>
													<Input
														type='text'
														placeholder={_.startCase(detail)}
														value={entry.details[detail] || ''}
														onChange={(e) =>
															updateEntry(entry.id, {
																details: {
																	...entry.details,
																	[detail]: e.target.value,
																},
															})
														}
													/>
												</div>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* ── Description (shared) ──────────────── */}
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
