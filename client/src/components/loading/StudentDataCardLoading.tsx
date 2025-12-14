import { Skeleton } from '@/components/ui/skeleton';

export default function StudentDataCardLoading() {
	return (
		<div className='rounded-2xl border bg-card/50 p-6 shadow-sm'>
			<div className='flex items-start gap-6'>
				{/* Avatar */}
				<Skeleton className='h-16 w-16 rounded-full' />

				<div className='flex-1 space-y-4'>
					{/* Name */}
					<div className='space-y-2'>
						<Skeleton className='h-6 w-[220px]' />
						<Skeleton className='h-4 w-[140px]' />
					</div>

					{/* Info grid */}
					<div className='grid gap-3 sm:grid-cols-2'>
						<div className='flex items-center gap-3'>
							<Skeleton className='h-4 w-4 rounded' />
							<div className='space-y-1'>
								<Skeleton className='h-3 w-[80px]' />
								<Skeleton className='h-4 w-[140px]' />
							</div>
						</div>

						<div className='flex items-center gap-3'>
							<Skeleton className='h-4 w-4 rounded' />
							<div className='space-y-1'>
								<Skeleton className='h-3 w-[80px]' />
								<Skeleton className='h-4 w-[160px]' />
							</div>
						</div>

						<div className='flex items-center gap-3'>
							<Skeleton className='h-4 w-4 rounded' />
							<div className='space-y-1'>
								<Skeleton className='h-3 w-[80px]' />
								<Skeleton className='h-4 w-[100px]' />
							</div>
						</div>

						<div className='flex items-center gap-3'>
							<Skeleton className='h-4 w-4 rounded' />
							<div className='space-y-1'>
								<Skeleton className='h-3 w-[80px]' />
								<Skeleton className='h-4 w-[90px]' />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
