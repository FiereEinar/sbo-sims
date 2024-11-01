'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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
import { fetchDashboardData } from '@/api/transaction';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { DashboardDataTransaction } from '@/pages/Dashboard';

export const description = 'An interactive bar chart';

const chartConfig = {
	views: {
		label: 'Amount',
	},
	totalAmount: {
		label: 'Total',
		color: 'hsl(var(--chart-1))',
	},
} satisfies ChartConfig;

type ChartData = DashboardDataTransaction[];

export default function BarCharts() {
	const [chartData, setChartData] = React.useState<ChartData>([]);

	const { data: dashboardData } = useQuery({
		queryKey: [QUERY_KEYS.DASHBOARD_DATA],
		queryFn: () => fetchDashboardData(),
	});

	React.useEffect(() => {
		if (dashboardData) {
			setChartData(dashboardData.transactions);
		}
	}, [dashboardData]);

	return (
		<Card>
			<CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
				<div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
					<CardTitle>Bar Chart - Interactive</CardTitle>
					<CardDescription>
						Showing total transactions for the last 3 months
					</CardDescription>
				</div>
				<div className='flex'>
					<button
						// data-active={activeChart === chart}
						className='relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6'
						// onClick={() => setActiveChart(chart)}
					>
						<span className='text-xs text-muted-foreground'>Total</span>
						<span className='text-lg font-bold leading-none sm:text-3xl'>
							P{dashboardData?.totalRevenue ?? 0}
						</span>
					</button>
				</div>
			</CardHeader>
			<CardContent className='px-2 sm:p-6'>
				<ChartContainer
					config={chartConfig}
					className='aspect-auto h-[250px] w-full'
				>
					<BarChart
						accessibilityLayer
						data={chartData}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey='date'
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
								});
							}}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className='w-[150px]'
									nameKey='views'
									labelFormatter={(value) => {
										return new Date(value).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
										});
									}}
								/>
							}
						/>
						<Bar dataKey={'totalAmount'} fill={`hsl(var(--chart-1))`} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
