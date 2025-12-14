import { Category } from '@/types/category';
import Header from './ui/header';
import { Banknote, Building2, Info } from 'lucide-react';
import { Badge } from './ui/badge';

type CategoryDataCardProps = {
	category: Category;
};

export default function CategoryDataCard({ category }: CategoryDataCardProps) {
	return (
		<div className='space-y-2'>
			{/* Context */}
			<p className='text-xs text-muted-foreground'>
				Viewing transaction history for
			</p>

			{/* Category name */}
			<Header size='md'>{category.name}</Header>

			{/* Core info */}
			<div className='grid gap-3 sm:grid-cols-2 text-sm'>
				<div className='flex items-center gap-2 text-muted-foreground'>
					<Building2 size={14} />
					<span>
						<span className='font-medium text-foreground'>Organization:</span>{' '}
						{category.organization.name}
					</span>
				</div>

				<div className='flex items-center gap-2 text-muted-foreground'>
					<Banknote size={14} />
					<span>
						<span className='font-medium text-foreground'>Fee:</span> P
						{category.fee}
					</span>
				</div>
			</div>

			{/* Details */}
			{category.details.length > 0 && (
				<div className='space-y-2'>
					<div className='flex items-center gap-2 text-muted-foreground text-sm'>
						<Info size={14} />
						<span>Required details</span>
					</div>

					<div className='flex flex-wrap gap-2'>
						{category.details.map((detail) => (
							<Badge key={detail} variant='secondary'>
								{detail}
							</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
