import StickyHeader from '../StickyHeader';
import { Skeleton } from '../ui/skeleton';

export default function StickyHeaderLoading() {
	return (
		<StickyHeader>
			<Skeleton className='w-48 h-10' />
			<div className='space-x-2 flex'>
				<Skeleton className='w-20 h-8' />
				<Skeleton className='w-20 h-8' />
			</div>
		</StickyHeader>
	);
}
