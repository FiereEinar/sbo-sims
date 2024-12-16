type DashboardInfoCardProps = {
	title: string;
	value: string;
	increase?: number;
};

export default function DashboardInfoCard({
	title,
	value,
	increase,
}: DashboardInfoCardProps) {
	return (
		<article className='transition-all bg-card border rounded-lg p-5 shadow-sm'>
			<p className='text-sm'>{title}</p>
			<h1 className='text-2xl font-bold'>{value}</h1>
			{increase && (
				<p className='text-xs text-green-500'>
					+ {increase.toFixed(2)}% from last month
				</p>
			)}
		</article>
	);
}
