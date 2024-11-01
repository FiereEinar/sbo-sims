import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
import BarCharts from '@/components/BarChart';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionPieChart from '@/components/TransactionPieChart';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { Category } from '@/types/category';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';

export type DashboardDataTransaction = {
	date: Date;
	totalAmount: number;
};

export type DashboardDataCategory = {
	category: Category;
	totalAmount: number;
	totalTransactions: number;
};

export type DashboardData = {
	totalRevenue: number;
	totalStudents: number;
	transactionsToday: number;
	totalTransaction: number;
	transactions: DashboardDataTransaction[];
	categories: DashboardDataCategory[];
};

export default function Dashboard() {
	const { data: fetchTransactionsResult } = useQuery({
		queryKey: [QUERY_KEYS.TRANSACTION],
		queryFn: () => fetchTransactions({}, 1, 3),
	});

	const { data: dashboardData } = useQuery({
		queryKey: [QUERY_KEYS.DASHBOARD_DATA],
		queryFn: () => fetchDashboardData(),
	});

	console.log(dashboardData);

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Dashboard</Header>
			</StickyHeader>

			<div className='flex gap-3'>
				<div className='flex flex-col gap-3'>
					<div className='grid grid-cols-4 gap-3'>
						<article className='transition-all bg-card border rounded-lg p-5 shadow-sm'>
							<p className='text-sm'>Total Revenue</p>
							<h1 className='text-2xl font-bold'>
								P{dashboardData?.totalRevenue ?? 0}
							</h1>
						</article>

						<article className='transition-all bg-card border rounded-lg p-5 shadow-sm'>
							<p className='text-sm'>Total Transactions</p>
							<h1 className='text-2xl font-bold'>
								{dashboardData?.totalTransaction ?? 0}
							</h1>
						</article>

						<article className='transition-all bg-card border rounded-lg p-5 shadow-sm'>
							<p className='text-sm'>Total Students</p>
							<h1 className='text-2xl font-bold'>
								{dashboardData?.totalStudents ?? 0}
							</h1>
						</article>

						<article className='transition-all bg-card border rounded-lg p-5 shadow-sm'>
							<p className='text-sm'>Transactions Today</p>
							<h1 className='text-2xl font-bold'>
								{dashboardData?.transactionsToday ?? 0}
							</h1>
						</article>
					</div>

					<BarCharts />
				</div>
				<div className='grid grid-cols-1 gap-3'>
					<TransactionPieChart />

					<div className='transition-all bg-card rounded-lg p-5 border'>
						<h2 className='font-semibold'>Recent Transactions</h2>
						<div className='h-[10rem]'>
							{fetchTransactionsResult?.data.length === 0 && (
								<p className='text-muted-foreground text-sm italic'>
									No recent transactions
								</p>
							)}
							{fetchTransactionsResult?.data.map((transaction) => (
								<div
									className='transition-all flex justify-between items-center hover:bg-card/90 border-t p-2'
									key={transaction._id}
								>
									<div className='w-[150px]'>
										<p>
											{_.startCase(transaction.owner.firstname.toLowerCase())}
										</p>
										<p className='text-xs text-muted-foreground'>
											{transaction.owner.studentID}
										</p>
									</div>

									<p className='font-bold'>P{transaction.amount}</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</SidebarPageLayout>
	);
}
