type DashboardInfoCardProps = {
	title: string;
	value: string;
	increase?: number;
	icon: JSX.Element;
};

export default function DashboardInfoCard({
	title,
	value,
	increase,
	icon,
}: DashboardInfoCardProps) {
	return (
		<article className='transition-all flex justify-between bg-card border rounded-lg p-5 shadow-sm'>
			<div>
				<p className='text-sm text-muted-foreground'>{title}</p>
				<h1 className='text-2xl font-bold'>{value}</h1>
				{increase && (
					<p
						className={`text-xs ${
							increase > 0 ? 'text-green-500' : 'text-muted-foreground'
						}`}
					>
						+ {increase.toFixed(2)}% from last month
					</p>
				)}
			</div>
			<div className='flex sm:hidden items-center justify-center'>{icon}</div>
		</article>
	);
}
