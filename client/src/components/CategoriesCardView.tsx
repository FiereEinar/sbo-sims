import { CategoryWithTransactions } from '@/types/category';
import { useNavigate } from 'react-router-dom';
import { numberWithCommas } from '@/lib/utils';
import { BookOpen, Users, DollarSign } from 'lucide-react';

interface CategoriesCardViewProps {
	categories?: CategoryWithTransactions[];
	isLoading: boolean;
}

export default function CategoriesCardView({
	categories,
	isLoading,
}: CategoriesCardViewProps) {
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

	if (!categories?.length) {
		return <p className='text-muted-foreground'>No categories found</p>;
	}

	return (
		<div className='space-y-4'>
			{categories.map((category) => (
				<div
					key={category._id}
					onClick={() => navigate(`/category/${category._id}`)}
					className='cursor-pointer rounded-2xl border bg-card/40 p-5 shadow-sm hover:shadow-md transition-all'
				>
					<div className='flex justify-between items-center gap-2'>
						<div>
							<h3 className='font-semibold text-lg'>{category.name}</h3>
							<p className='text-sm text-muted-foreground'>
								{category.organization.name}
							</p>
						</div>
						<div className='text-right'>
							<p className='text-sm font-medium'>
								₱ {numberWithCommas(category.fee)}
							</p>
						</div>
					</div>

					<div className='mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground'>
						<div className='flex items-center gap-1'>
							<Users size={14} />
							<p>Total Transactions: {category.totalTransactions}</p>
						</div>
						<div className='flex items-center gap-1'>
							<DollarSign size={14} />
							<p>
								Amount: ₱ {numberWithCommas(category.totalTransactionsAmount)}
							</p>
						</div>
						<div className='flex items-center gap-1'>
							<BookOpen size={14} />
							<p>Category Fee: ₱ {numberWithCommas(category.fee)}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
