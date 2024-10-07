import { fetchTransactions, submitTransactionForm } from '@/api/transaction';
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
import { format } from 'date-fns';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Category } from '@/types/category';
import { z } from 'zod';

type AddTransactionFormProps = {
	categories: Category[];
};

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function AddTransactionForm({
	categories,
}: AddTransactionFormProps) {
	const [date, setDate] = useState<Date>();
	const [category, setCategory] = useState<string>();

	const { refetch } = useQuery({
		queryKey: ['transactions'],
		queryFn: fetchTransactions,
	});

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionSchema),
	});

	// TODO: create another input field for time
	const onSubmit = async (data: TransactionFormValues) => {
		try {
			if (!date) {
				setError('date', { message: 'Pick a date' });
				return;
			}
			if (!category) {
				setError('categoryID', { message: 'Pick a category' });
				return;
			}

			const now = new Date();
			data.date = date;
			data.date.setHours(now.getHours());
			data.date.setMinutes(now.getMinutes());
			data.date.setSeconds(now.getSeconds());
			data.categoryID = category;

			console.log(data);

			const result = await submitTransactionForm(data);

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

			refetch();
			reset();
		} catch (err: any) {
			setError('root', { message: 'Failed to submit transaction form' });
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='flex justify-center gap-1' size='sm'>
					<img className='size-5' src='/icons/plus.svg' alt='' />
					<p>Add Transaction</p>
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add Transaction</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				{/* TODO: factor out all this shit */}
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

					{/* Date picker */}
					<Popover>
						<PopoverTrigger asChild>
							<div className='text-muted-foreground space-y-1'>
								<Label>Date:</Label>
								<Button
									type='button'
									variant={'outline'}
									className={cn(
										'w-full justify-start text-left font-normal',
										!date && 'text-muted-foreground'
									)}
								>
									<CalendarIcon className='mr-2 h-4 w-4' />
									{date ? format(date, 'PPP') : <span>Pick a date</span>}
								</Button>
								{errors.date && errors.date.message && (
									<p className='text-xs text-destructive'>
										{errors.date.message.toString()}
									</p>
								)}
							</div>
						</PopoverTrigger>
						<PopoverContent className='w-auto p-0'>
							<Calendar
								mode='single'
								selected={date}
								onSelect={setDate}
								initialFocus
							/>
						</PopoverContent>
					</Popover>

					{/* Category picker */}
					<div className='text-muted-foreground space-y-1'>
						<Label>Category:</Label>
						<Select onValueChange={(value) => setCategory(value)}>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder='Select a category' />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category._id} value={category._id}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.categoryID && errors.categoryID.message && (
							<p className='text-xs text-destructive'>
								{errors.categoryID.message.toString()}
							</p>
						)}
					</div>

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
