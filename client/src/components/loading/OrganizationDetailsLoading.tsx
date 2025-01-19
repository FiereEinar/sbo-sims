import { Skeleton } from '../ui/skeleton';

export default function OrganizationDetailsLoading() {
	return (
		<div className='space-y-2'>
			<Skeleton className='w-[300px] h-4' />
			<Skeleton className='w-[250px] h-4' />
			<Skeleton className='w-[350px] h-4' />
			<Skeleton className='w-[325px] h-4' />
			<Skeleton className='w-[150px] h-4' />
		</div>
	);
}
