'use client';

import * as React from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { fetchDashboardData } from '@/api/transaction';
import _ from 'lodash';
import { numberWithCommas } from '@/lib/utils';

export const description = 'A donut chart with text';

import { ring } from 'ldrs';

ring.register();

type ChartData = {
	category: string;
	totalAmount: number;
	fill: string;
};

type ChartConfigType = {
	[key: string]: { label: string; color?: string };
};

type TransactionPieChartProps = {
	isLoading: boolean;
};

export default function TransactionPieChart({
	isLoading,
}: TransactionPieChartProps) {
	const colors = [
		'hsl(var(--chart-1))',
		'hsl(var(--chart-2))',
		'hsl(var(--chart-3))',
		'hsl(var(--chart-4))',
		'hsl(var(--chart-5))',
	];

	const [chartConfig, setChartConfig] = React.useState<ChartConfigType>({});

	const [chartData, setChartData] = React.useState<ChartData[]>([]);

	const { data: dashboardData } = useQuery({
		queryKey: [QUERY_KEYS.DASHBOARD_DATA],
		queryFn: () => fetchDashboardData(),
	});

	React.useEffect(() => {
		if (dashboardData) {
			let i = 0;

			let chartConfigsTemp: ChartConfigType = {
				visitors: {
					label: 'Transactions',
				},
			};

			let chartDataTemp: ChartData[] = [];

			dashboardData.categories.map((category) => {
				const categoryName = `${category.category.organization.name} - ${category.category.name}`;
				const categoryNameNoSpace = categoryName.split(' ').join('');

				chartConfigsTemp[categoryNameNoSpace] = {
					label: categoryName + ': ',
					color: colors[i++],
				};

				chartDataTemp.push({
					category: categoryNameNoSpace,
					totalAmount: category.totalAmount,
					fill: `var(--color-${categoryNameNoSpace})`,
				});

				if (i === colors.length) i = 0;
			});

			setChartData(chartDataTemp);
			setChartConfig(chartConfigsTemp);
		}
	}, [dashboardData, setChartData, setChartConfig]);

	return (
		<Card className='flex flex-col bg-card/40'>
			<CardHeader className='items-center pb-0'>
				<CardTitle>Collections by Category</CardTitle>
				{/* <CardDescription>January - June 2024</CardDescription> */}
			</CardHeader>
			<CardContent className='flex-1 pb-0'>
				{isLoading ? (
					<div className='mx-auto aspect-square max-h-[250px] flex items-center justify-center'>
						<l-ring
							size='100'
							stroke='12'
							bg-opacity='0'
							speed='2'
							color='#1f1f1f'
						></l-ring>
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className='mx-auto aspect-square max-h-[250px]'
					>
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>
							<Pie
								data={chartData}
								dataKey='totalAmount'
								nameKey='category'
								innerRadius={60}
								strokeWidth={5}
							>
								<Label
									content={({ viewBox }) => {
										if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
											return (
												<text
													x={viewBox.cx}
													y={viewBox.cy}
													textAnchor='middle'
													dominantBaseline='middle'
												>
													<tspan
														x={viewBox.cx}
														y={viewBox.cy}
														className='fill-foreground text-3xl font-bold'
													>
														{numberWithCommas(dashboardData?.totalRevenue ?? 0)}
													</tspan>
													<tspan
														x={viewBox.cx}
														y={(viewBox.cy || 0) + 24}
														className='fill-muted-foreground'
													>
														Total Collections
													</tspan>
												</text>
											);
										}
									}}
								/>
							</Pie>
						</PieChart>
					</ChartContainer>
				)}
			</CardContent>
			<CardFooter className='flex-col gap-2 text-sm'></CardFooter>
		</Card>
	);
}
