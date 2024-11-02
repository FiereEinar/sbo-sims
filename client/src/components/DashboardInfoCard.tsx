type DashboardInfoCardProps = {
	title: string;
	value: string;
};

export default function DashboardInfoCard({
	title,
	value,
}: DashboardInfoCardProps) {
	return (
		<article className='transition-all bg-card border rounded-lg p-5 shadow-sm'>
			<p className='text-sm'>{title}</p>
			<h1 className='text-2xl font-bold'>{value}</h1>
		</article>
	);
}
