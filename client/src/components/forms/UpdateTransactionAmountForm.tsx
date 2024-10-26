import { submitUpdateTransactionAmountForm } from '@/api/transaction';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { DialogHeader, DialogFooter } from '../ui/dialog';
import InputField from '../InputField';
import { z } from 'zod';
import { Transaction } from '@/types/transaction';
import ErrorText from '../ui/error-text';
import { QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';

export const updateTransactionAmountSchema = z.object({
	amount: z
		.string()
		.refine((val) => !Number.isNaN(parseInt(val, 10)), {
			message: 'Enter a valid amount',
		})
		.refine((val) => parseInt(val, 10) > 0, {
			message: 'Please enter a non-negative number',
		}),
});

export type UpdateTransactionAmountFormValues = z.infer<
	typeof updateTransactionAmountSchema
>;

type UpdateTransactionAmountFormProps = {
	transaction: Transaction;
};

export default function UpdateTransactionAmountForm({
	transaction,
}: UpdateTransactionAmountFormProps) {
	const remainingAmountToBePaid = transaction.category.fee - transaction.amount;

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<UpdateTransactionAmountFormValues>({
		resolver: zodResolver(updateTransactionAmountSchema),
		defaultValues: {
			amount: remainingAmountToBePaid.toString(),
		},
	});

	// TODO: create another input field for time
	const onSubmit = async (data: UpdateTransactionAmountFormValues) => {
		try {
			const result = await submitUpdateTransactionAmountForm(
				transaction._id,
				data
			);

			if (!result) {
				setError('root', {
					message: 'Something went wrong while trying to submit your form',
				});
				return;
			}

			if (!result.success) {
				setError('root', {
					message: `${result.message} ${result.error ?? ''}`,
				});
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.TRANSACTION],
			});
			reset();
		} catch (err: any) {
			setError('root', {
				message: 'Failed to submit add transaction amount form',
			});
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='secondary' size='sm'>
					<p>Add Amount</p>
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add Transaction Amount</DialogTitle>
					<DialogDescription>
						<span>Required amount: {transaction.category.fee}</span>
						<br />
						<span>Paid amount: {transaction.amount}</span>
						<br />
						<span>Remaining amount to be paid: {remainingAmountToBePaid}</span>
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<UpdateTransactionAmountFormValues>
						name='amount'
						type='number'
						registerFn={register}
						errors={errors}
						label='Amount:'
						id='amount'
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
