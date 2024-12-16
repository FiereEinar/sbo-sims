import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
import BarCharts from '@/components/BarChart';
import DashboardInfoCard from '@/components/DashboardInfoCard';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionPieChart from '@/components/TransactionPieChart';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { numberWithCommas } from '@/lib/utils';
import { APIPaginatedResponse } from '@/types/api-response';
import { Category } from '@/types/category';
import { Transaction } from '@/types/transaction';
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

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Dashboard</Header>
			</StickyHeader>

			<div className='flex flex-col md:flex-row gap-3'>
				<div className='flex flex-col-reverse sm:flex-col gap-3'>
					<DashboardInfoGrid dashboardData={dashboardData} />
					<BarCharts dashboardData={dashboardData} />
				</div>

				<div className='grid grid-cols-1 gap-3'>
					<TransactionPieChart />
					<DashboardRecenTransactions
						fetchTransactionsResult={fetchTransactionsResult}
					/>
				</div>
			</div>
		</SidebarPageLayout>
	);
}

type DashboardInfoGridProps = {
	dashboardData?: DashboardData;
};

function DashboardInfoGrid({ dashboardData }: DashboardInfoGridProps) {
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'>
			<DashboardInfoCard
				title='Total Revenue'
				value={'P' + numberWithCommas(dashboardData?.totalRevenue ?? 0)}
			/>

			<DashboardInfoCard
				title='Total Transactions'
				value={numberWithCommas(dashboardData?.totalTransaction ?? 0)}
			/>

			<DashboardInfoCard
				title='Total Students'
				value={numberWithCommas(dashboardData?.totalStudents ?? 0)}
			/>
			<DashboardInfoCard
				title='Transactions Today'
				value={numberWithCommas(dashboardData?.transactionsToday ?? 0)}
			/>
		</div>
	);
}

type DashboardRecenTransactionsProps = {
	fetchTransactionsResult?: APIPaginatedResponse<Transaction[]>;
};

function DashboardRecenTransactions({
	fetchTransactionsResult,
}: DashboardRecenTransactionsProps) {
	return (
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
							<p>{_.startCase(transaction.owner.firstname.toLowerCase())}</p>
							<p className='text-xs text-muted-foreground'>
								{transaction.owner.studentID}
							</p>
						</div>

						<p className='font-bold'>P{transaction.amount}</p>
					</div>
				))}
			</div>
		</div>
	);
}
