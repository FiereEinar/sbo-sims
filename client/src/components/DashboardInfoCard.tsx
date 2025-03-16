import { Skeleton } from './ui/skeleton';

type DashboardInfoCardProps = {
	title: string;
	value: string;
	increase?: number;
	icon: JSX.Element;
	isLoading: boolean;
};

export default function DashboardInfoCard({
	title,
	value,
	increase,
	icon,
	isLoading,
}: DashboardInfoCardProps) {
	return (
		<article className='transition-all flex justify-between bg-card/40 border rounded-lg p-5 shadow-sm'>
			<div className='transition-all'>
				<p className='text-sm text-muted-foreground'>{title}</p>
				{isLoading ? (
					<div className='space-y-2'>
						<Skeleton className='w-[100px] h-[20px]' />
						<Skeleton className='w-[150px] h-[20px]' />
					</div>
				) : (
					<>
						<h1 className='text-2xl font-bold'>{value}</h1>
						{increase !== undefined && (
							<p
								className={`text-xs ${
									increase > 0 ? 'text-green-500' : 'text-muted-foreground'
								}`}
							>
								+ {increase.toFixed(2)}% from last month
							</p>
						)}
					</>
				)}
			</div>
			<div className='flex items-center justify-center'>{icon}</div>
		</article>
	);
}
