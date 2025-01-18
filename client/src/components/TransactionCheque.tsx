import { Transaction } from '@/types/transaction';
import Header from './ui/header';
import _ from 'lodash';

type TransactionChequeProps = {
	transaction: Transaction;
};

export default function TransactionCheque({
	transaction,
}: TransactionChequeProps) {
	const owner = transaction.owner;
	const ownerFullname = _.startCase(
		`${owner.firstname} ${owner.middlename} ${owner.lastname}`.toLowerCase()
	);
	const fee = transaction.category.fee;
	const isPaid = transaction.amount >= fee;

	return (
		<article className='relative flex flex-col gap-10 items-center bg-card/40 border rounded-md w-full p-3'>
			<div className='flex justify-between gap-10 w-full'>
				<div>
					<Header size='md'>{ownerFullname}</Header>
					<p className='text-muted-foreground text-sm'>{owner.studentID}</p>
				</div>

				<div className='flex flex-col items-end'>
					<Header size='md'>
						P{transaction.amount}
						{!isPaid && `/P${fee}`}
					</Header>
					<p
						className={`text-sm ${
							isPaid ? 'text-green-500' : 'text-yellow-500'
						}`}
					>
						{isPaid ? 'fully paid' : 'partial'}
					</p>
				</div>
			</div>

			<div className='text-muted-foreground w-full'>
				<p>Date: {new Date(transaction.date).toDateString()}</p>
				<p>Transaction ID: {transaction._id}</p>
				{transaction.description && (
					<p>Description: {transaction.description}</p>
				)}
			</div>

			<div className='flex flex-col items-center w-full text-center'>
				<Header size='sm'>
					{transaction.category.organization.name}
					{' - '}
					{transaction.category.name}
				</Header>
				<p className='text-muted-foreground text-sm'>
					{_.startCase(transaction.governor)} |{' '}
					{_.startCase(transaction.viceGovernor)} |{' '}
					{_.startCase(transaction.treasurer)} |{' '}
					{_.startCase(transaction.auditor)}
				</p>
			</div>
		</article>
	);
}
