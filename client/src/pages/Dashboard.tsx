import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
import BarCharts from '@/components/BarChart';
import DashboardInfoCard from '@/components/DashboardInfoCard';
import Dollar from '@/components/icons/dollar';
import Ledger from '@/components/icons/ledger';
import Person from '@/components/icons/person';
import Today from '@/components/icons/today';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionPieChart from '@/components/TransactionPieChart';
import Header from '@/components/ui/header';
import { Skeleton } from '@/components/ui/skeleton';
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
	totalRevenueLastMonth: number;
	totalStudents: number;
	transactionsToday: number;
	totalTransaction: number;
	totalTransactionLastMonth: number;
	transactions: DashboardDataTransaction[];
	categories: DashboardDataCategory[];
};

export default function Dashboard() {
	const { data: dashboardData, isLoading } = useQuery({
		queryKey: [QUERY_KEYS.DASHBOARD_DATA],
		queryFn: () => fetchDashboardData(),
	});

	const {
		data: fetchTransactionsResult,
		isLoading: fetchingRecentTransactions,
	} = useQuery({
		queryKey: [QUERY_KEYS.TRANSACTION],
		queryFn: () => fetchTransactions({}, 1, 3),
	});

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>
					<div className='flex items-center gap-3'>
						<p>Dashboard</p>
						{isLoading ||
							(fetchingRecentTransactions && (
								<p className='text-xs text-muted-foreground'>
									Fetching data...
								</p>
							))}
					</div>
				</Header>
			</StickyHeader>

			<div className='flex flex-col md:flex-row gap-3 w-[93dvw] sm:w-full'>
				<div className='flex w-full flex-col-reverse sm:flex-col gap-3'>
					<DashboardInfoGrid
						dashboardData={dashboardData}
						isLoading={isLoading}
					/>
					<BarCharts dashboardData={dashboardData} isLoading={isLoading} />
				</div>

				<div className='grid grid-cols-1 gap-3 flex-shrink-0'>
					<TransactionPieChart isLoading={isLoading} />
					<DashboardRecenTransactions
						fetchTransactionsResult={fetchTransactionsResult}
						isLoading={fetchingRecentTransactions}
					/>
				</div>
			</div>
		</SidebarPageLayout>
	);
}

type DashboardInfoGridProps = {
	dashboardData?: DashboardData;
	isLoading: boolean;
};

function DashboardInfoGrid({
	dashboardData,
	isLoading,
}: DashboardInfoGridProps) {
	const totalRevenue = dashboardData?.totalRevenue ?? 0;
	const totalRevenueLastMonth = dashboardData?.totalRevenueLastMonth ?? 0;
	const totalTransaction = dashboardData?.totalTransaction ?? 0;
	const totalTransactionLastMonth =
		dashboardData?.totalTransactionLastMonth ?? 0;

	const revenueDifference = totalRevenue - totalRevenueLastMonth;
	const revenueIncreaseInPercentage = (revenueDifference / totalRevenue) * 100;

	const transactionDifference = totalTransaction - totalTransactionLastMonth;
	const transactionIncreaseInPercentage =
		(transactionDifference / totalTransaction) * 100;

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3'>
			<DashboardInfoCard
				title='Total Collections'
				value={'P' + numberWithCommas(dashboardData?.totalRevenue ?? 0)}
				increase={
					totalRevenueLastMonth === 0
						? undefined
						: revenueIncreaseInPercentage || 0
				}
				icon={<Dollar />}
				isLoading={isLoading}
			/>
			<DashboardInfoCard
				title='Total Transactions'
				value={numberWithCommas(dashboardData?.totalTransaction ?? 0)}
				increase={
					totalTransactionLastMonth === 0
						? undefined
						: transactionIncreaseInPercentage || 0
				}
				icon={<Ledger />}
				isLoading={isLoading}
			/>
			<DashboardInfoCard
				title='Total Students'
				value={numberWithCommas(dashboardData?.totalStudents ?? 0)}
				icon={<Person />}
				isLoading={isLoading}
			/>
			<DashboardInfoCard
				title='Transactions Today'
				value={numberWithCommas(dashboardData?.transactionsToday ?? 0)}
				icon={<Today />}
				isLoading={isLoading}
			/>
		</div>
	);
}

type DashboardRecenTransactionsProps = {
	fetchTransactionsResult?: APIPaginatedResponse<Transaction[]>;
	isLoading: boolean;
};

function DashboardRecenTransactions({
	fetchTransactionsResult,
	isLoading,
}: DashboardRecenTransactionsProps) {
	return (
		<div className='transition-all bg-card/40 shadow-sm rounded-lg p-5 border'>
			<h2 className='font-semibold text-muted-foreground'>
				Recent Transactions
			</h2>
			<div className='h-[10rem]'>
				{fetchTransactionsResult?.data.length === 0 && (
					<p className='text-muted-foreground text-sm italic'>
						No recent transactions
					</p>
				)}
				{isLoading ? (
					<div className='space-y-2 pt-4'>
						<Skeleton className='w-full h-10' />
						<hr />
						<Skeleton className='w-full h-10' />
						<hr />
						<Skeleton className='w-full h-10' />
					</div>
				) : (
					<>
						{fetchTransactionsResult?.data.map((transaction, i, arr) => (
							<div
								className={`transition-all flex justify-between items-center hover:bg-card/90 p-2 ${
									i !== arr.length - 1 && 'border-b'
								}`}
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
					</>
				)}
			</div>
		</div>
	);
}
