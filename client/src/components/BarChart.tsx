'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { DashboardData, DashboardDataTransaction } from '@/pages/Dashboard';
import { numberWithCommas } from '@/lib/utils';
import { addDays, eachDayOfInterval, subDays } from 'date-fns';
import { Skeleton } from './ui/skeleton';

const chartConfig = {
	views: {
		label: 'Amount',
	},
	totalAmount: {
		label: 'Collections (₱)',
		color: 'hsl(var(--primary))',
	},
} satisfies ChartConfig;

type ChartData = DashboardDataTransaction[];

type BarChartsProps = {
	dashboardData?: DashboardData;
	isLoading: boolean;
};

const generateChartData = (
	data: DashboardDataTransaction[] = [],
	daysWindow: number = 30
): ChartData => {
	const today = addDays(new Date(), 1);
	const intervalDays = eachDayOfInterval({
		start: subDays(today, daysWindow),
		end: today,
	});

	return intervalDays.map<DashboardDataTransaction>((date) => {
		const dateStr = date.toISOString().split('T')[0];
		const transaction = data.find(
			(t) => new Date(t.date).toISOString().split('T')[0] === dateStr
		);
		return {
			date: dateStr as unknown as Date,
			totalAmount: transaction?.totalAmount ?? 0,
		};
	});
};

export default function BarCharts({
	dashboardData,
	isLoading,
}: BarChartsProps) {
	const [daysWindow, setDaysWindow] = React.useState<number>(30);
	const [chartData, setChartData] = React.useState<ChartData>([]);

	React.useEffect(() => {
		if (dashboardData?.transactions) {
			setChartData(generateChartData(dashboardData.transactions, daysWindow));
		} else {
			setChartData(generateChartData([], daysWindow));
		}
	}, [dashboardData, daysWindow]);

	const totalInView = React.useMemo(() => {
		return chartData.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
	}, [chartData]);

	return (
		<Card className='border bg-card/60 shadow-sm'>
			<CardHeader className='flex flex-col items-start justify-between gap-3 border-b border-border/40 p-4 sm:flex-row sm:items-center sm:p-5'>
				<div className='space-y-1'>
					<CardTitle className='text-base font-semibold tracking-tight'>
						Daily Collection Velocity
					</CardTitle>
					<CardDescription className='text-xs text-muted-foreground'>
						Showing daily intake for the last {daysWindow} days
					</CardDescription>
				</div>
				<div className='flex items-center gap-2 self-end sm:self-auto'>
					<div className='inline-flex rounded-lg border border-border/50 bg-muted/40 p-0.5 text-xs'>
						<button
							type='button'
							onClick={() => setDaysWindow(30)}
							className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
								daysWindow === 30
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							30 Days
						</button>
						<button
							type='button'
							onClick={() => setDaysWindow(60)}
							className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
								daysWindow === 60
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							60 Days
						</button>
						<button
							type='button'
							onClick={() => setDaysWindow(90)}
							className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
								daysWindow === 90
									? 'bg-background text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							90 Days
						</button>
					</div>
					<div className='hidden text-right lg:block pl-3 border-l border-border/40'>
						<p className='text-[10px] uppercase font-semibold text-muted-foreground tracking-wider'>
							Window Total
						</p>
						<p className='text-sm font-bold tabular-nums text-foreground'>
							₱{numberWithCommas(totalInView)}
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className='p-3 sm:p-5'>
				{isLoading ? (
					<div className='h-[260px] w-full flex items-end gap-2 px-4 pb-4'>
						{[40, 65, 30, 85, 45, 60, 75, 50, 90, 35, 70, 80].map((h, i) => (
							<Skeleton
								key={i}
								className='flex-1 rounded-t-sm'
								style={{ height: `${h}%` }}
							/>
						))}
					</div>
				) : chartData.length === 0 || totalInView === 0 ? (
					<div className='h-[260px] w-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground'>
						<p className='text-sm font-medium'>No transactions logged in this {daysWindow}-day period.</p>
						<p className='text-xs text-muted-foreground/80 mt-1'>
							Transactions recorded at booths or imported will populate this velocity chart.
						</p>
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className='aspect-auto h-[260px] w-full'
					>
						<BarChart
							accessibilityLayer
							data={chartData}
							margin={{
								left: 4,
								right: 4,
								top: 8,
								bottom: 4,
							}}
						>
							<CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-border/40' />
							<XAxis
								dataKey='date'
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={28}
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
									});
								}}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={6}
								width={45}
								tickFormatter={(val) => `₱${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
								className='text-[10px] tabular-nums'
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										className='w-[160px]'
										nameKey='views'
										labelFormatter={(value) => {
											return new Date(value).toLocaleDateString('en-US', {
												weekday: 'short',
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											});
										}}
										formatter={(value) => [
											<span className='font-semibold tabular-nums text-foreground'>
												₱{numberWithCommas(Number(value))}
											</span>,
											'Intake',
										]}
									/>
								}
							/>
							<Bar
								dataKey='totalAmount'
								fill='hsl(var(--primary))'
								radius={[3, 3, 0, 0]}
								maxBarSize={28}
							/>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
