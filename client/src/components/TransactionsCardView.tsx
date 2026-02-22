import { Transaction } from '@/types/transaction';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { format } from 'date-fns';
import {
	Calendar,
	BookOpen,
	CheckCircle,
	Clock,
	Tags,
	Building2,
} from 'lucide-react';
import { formatOrdinals, numberWithCommas } from '@/lib/utils';

interface TransactionsCardViewProps {
	transactions?: Transaction[];
	isLoading: boolean;
}

export default function TransactionsCardView({
	transactions,
	isLoading,
}: TransactionsCardViewProps) {
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className='space-y-4'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='rounded-2xl border p-5 shadow-sm animate-pulse h-40'
					></div>
				))}
			</div>
		);
	}

	if (!transactions?.length) {
		return <p className='text-muted-foreground'>No transactions</p>;
	}

	return (
		<div className='space-y-4'>
			{transactions.map((tx) => {
				const fullName = _.startCase(
					`${tx.owner.firstname} ${tx.owner.middlename ?? ''} ${tx.owner.lastname}`.toLowerCase(),
				);

				return (
					<div
						key={tx._id}
						onClick={() => navigate(`/transaction/${tx._id}`)}
						className='cursor-pointer rounded-2xl p-5 shadow-sm hover:shadow-md bg-card/40 border transition-all'
					>
						<div className='flex justify-between items-center'>
							<div>
								<h3 className='font-semibold text-lg'>{fullName}</h3>
								<p className='text-sm text-muted-foreground'>
									ID: {tx.owner.studentID}
								</p>
							</div>
							<div className='text-right'>
								<p className='text-sm font-medium'>
									₱ {numberWithCommas(tx.amount)}
								</p>
								<p className='text-xs text-muted-foreground'>
									{tx.amount >= tx.category.fee ? 'Paid' : 'Partial'}
								</p>
							</div>
						</div>

						<div className='mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground'>
							<div className='flex items-center gap-1'>
								<BookOpen size={14} />
								<p>{tx.owner.course}</p>
							</div>
							<div className='flex items-center gap-1'>
								<Clock size={14} />
								<p>{formatOrdinals(tx.owner.year)} year</p>
							</div>
							<div className='flex items-center gap-1'>
								<Calendar size={14} />
								<p>{format(new Date(tx.date), 'MM/dd/yyyy')}</p>
							</div>
							<div className='flex items-center gap-1'>
								<Building2 size={14} />
								<p>{tx.category.organization.name}</p>
							</div>
							<div className='flex items-center gap-1'>
								<Tags size={14} />
								<p>{tx.category.name}</p>
							</div>
							<div className='flex items-center gap-1'>
								<CheckCircle
									size={14}
									className={
										tx.amount >= tx.category.fee
											? 'text-green-500'
											: 'text-yellow-500'
									}
								/>
								<p>{tx.amount >= tx.category.fee ? 'Paid' : 'Partial'}</p>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
