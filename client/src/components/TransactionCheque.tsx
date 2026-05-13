import { Transaction } from '@/types/transaction';
import Header from './ui/header';
import _ from 'lodash';
import { BadgeCheck, AlertCircle, Calendar, Hash } from 'lucide-react';

interface TransactionChequeProps {
	transaction: Transaction;
}

export default function TransactionCheque({
	transaction,
}: TransactionChequeProps) {
	const owner = transaction.owner;

	const ownerFullname = _.startCase(
		`${owner.firstname} ${owner.middlename ?? ''} ${
			owner.lastname
		}`.toLowerCase(),
	);

	const fee = transaction.category.fee;
	const isPaid = transaction.amount >= fee;

	return (
		<article className='relative rounded-2xl border bg-card/50 p-6 shadow-sm space-y-6'>
			{/* Header */}
			<div className='flex items-start justify-between gap-6'>
				<div>
					<Header size='md'>{ownerFullname}</Header>
					<p className='text-sm text-muted-foreground'>{owner.studentID}</p>
				</div>

				<div className='text-right'>
					<p className='text-2xl font-semibold'>
						P{transaction.amount}
						{!isPaid && (
							<span className='text-sm text-muted-foreground'>/ P{fee}</span>
						)}
					</p>

					<div
						className={`inline-flex items-center gap-1 text-xs font-medium ${
							isPaid ? 'text-emerald-600' : 'text-amber-500'
						}`}
					>
						{isPaid ? <BadgeCheck size={14} /> : <AlertCircle size={14} />}
						{isPaid ? 'Fully Paid' : 'Partial Payment'}
					</div>
				</div>
			</div>

			{/* Meta Info */}
			<div className='flex items-start justify-between gap-6 text-sm flex-wrap'>
				<div className='text-muted-foreground'>
					<div className='flex items-center gap-2 '>
						<Calendar size={14} />
						<span>{new Date(transaction.date).toDateString()}</span>
					</div>
					<div>
						Recorded By:{' '}
						{transaction.recordedBy
							? _.startCase(
									transaction.recordedBy.firstname +
										' ' +
										transaction.recordedBy.lastname,
								)
							: 'Unknown'}
					</div>
					<div className='flex items-center gap-2'>
						Mode of Payment:{' '}
						<span className='font-medium text-foreground'>
							{transaction.modeOfPayment === 'gcash' ? 'GCash' : 'Cash'}
						</span>
					</div>
				</div>

				<div className='flex items-center gap-2 text-muted-foreground'>
					<Hash size={14} />
					<span className='truncate'>{transaction._id}</span>
				</div>
			</div>

			{/* Details */}
			<div className='space-y-1 text-sm text-muted-foreground'>
				{transaction.description && (
					<p>
						<span className='font-medium text-foreground'>Description:</span>{' '}
						{transaction.description}
					</p>
				)}

				{transaction.category?.details?.map((detail) => {
					const value = transaction.details?.[detail];
					if (value === undefined) return null;

					return (
						<p key={detail}>
							<span className='font-medium text-foreground'>
								{_.startCase(detail)}:
							</span>{' '}
							{String(value)}
						</p>
					);
				})}
			</div>

			{/* Payment History Log */}
			{transaction.paymentHistory && transaction.paymentHistory.length > 1 && (
				<div className='border-t pt-4 space-y-2'>
					<h4 className='text-sm font-medium text-foreground flex items-center gap-2'>
						Payment History
						<span className='text-xs font-normal text-muted-foreground px-2 py-0.5 bg-secondary rounded-full'>
							{transaction.paymentHistory.length} payments
						</span>
					</h4>
					<div className='space-y-2'>
						{transaction.paymentHistory.map((entry, index) => (
							<div key={index} className='flex items-center justify-between text-xs'>
								<div className='flex flex-col'>
									<span className='font-medium text-foreground w-16'>P{entry.amount}</span>
									<span className='text-muted-foreground'>{new Date(entry.date).toDateString()}</span>
								</div>
								<span className='uppercase font-medium text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded'>
									{entry.modeOfPayment}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Footer */}
			<div className='border-t pt-4 space-y-1'>
				<Header size='sm'>
					{transaction.category.organization.name}
					{' · '}
					{transaction.category.name}
				</Header>

				<p className='text-xs text-muted-foreground'>
					{_.startCase(transaction.governor)} ·{' '}
					{_.startCase(transaction.viceGovernor)} ·{' '}
					{_.startCase(transaction.treasurer)} ·{' '}
					{_.startCase(transaction.auditor)}
				</p>
			</div>
		</article>
	);
}
