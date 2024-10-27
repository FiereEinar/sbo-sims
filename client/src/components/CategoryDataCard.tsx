import { Category } from '@/types/category';
import Header from './ui/header';

type CategoryDataCardProps = {
	category: Category;
};

export default function CategoryDataCard({ category }: CategoryDataCardProps) {
	return (
		<div>
			<p className='text-xs text-muted-foreground'>
				Previous transactions for{' '}
			</p>
			<Header>{category.name}</Header>
			<p className='text-muted-foreground flex gap-1'>
				Organization: {category.organization.name}
			</p>
			<p className='text-muted-foreground flex gap-1'>
				Category fee: P{category.fee}
			</p>
		</div>
	);
}
