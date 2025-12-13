import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
import BarCharts from '@/components/BarChart';
import TransactionPieChart from '@/components/TransactionPieChart';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { Skeleton } from '@/components/ui/skeleton';
import { QUERY_KEYS } from '@/constants';
import { numberWithCommas } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import Dollar from '@/components/icons/dollar';
import Ledger from '@/components/icons/ledger';
import Person from '@/components/icons/person';
import Today from '@/components/icons/today';
import _ from 'lodash';
import { Transaction } from '@/types/transaction';
import { Category } from '@/types/category';

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

type StatCardProps = {
	title: string;
	value: string;
	icon: JSX.Element;
	delta?: number;
	isLoading: boolean;
};

function StatCard({ title, value, icon, delta, isLoading }: StatCardProps) {
	return (
		<div className='rounded-2xl border bg-card/50 p-5 shadow-sm flex justify-between items-start'>
			<div className='space-y-1'>
				<p className='text-xs text-muted-foreground uppercase tracking-wide'>
					{title}
				</p>
				{isLoading ? (
					<div className='space-y-2'>
						<Skeleton className='h-6 w-28' />
						<Skeleton className='h-4 w-40' />
					</div>
				) : (
					<>
						<p className='text-2xl font-semibold'>{value}</p>
						{delta !== undefined && (
							<p
								className={`text-xs ${
									delta >= 0 ? 'text-emerald-500' : 'text-rose-500'
								}`}
							>
								{delta >= 0 ? '+' : ''}
								{delta ? delta.toFixed(2) : 0}% vs last month
							</p>
						)}
					</>
				)}
			</div>
			<div className='rounded-xl bg-primary/10 p-3 text-primary'>{icon}</div>
		</div>
	);
}

type RecentTransactionsProps = {
	data?: Transaction[];
	isLoading: boolean;
};

function RecentTransactions({ data, isLoading }: RecentTransactionsProps) {
	return (
		<div className='rounded-2xl border bg-card/50 p-5 shadow-sm'>
			<h2 className='font-semibold mb-3'>Recent Transactions</h2>
			{isLoading ? (
				<div className='space-y-2'>
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
					<Skeleton className='h-10 w-full' />
				</div>
			) : data?.length ? (
				<div className='divide-y'>
					{data.map((t) => (
						<div key={t._id} className='flex items-center justify-between py-2'>
							<div>
								<p className='text-sm font-medium'>
									{_.startCase(t.owner.firstname.toLowerCase())}
								</p>
								<p className='text-xs text-muted-foreground'>
									{t.owner.studentID}
								</p>
							</div>
							<p className='font-semibold'>P{numberWithCommas(t.amount)}</p>
						</div>
					))}
				</div>
			) : (
				<p className='text-sm text-muted-foreground italic'>
					No recent transactions
				</p>
			)}
		</div>
	);
}

export default function Dashboard() {
	const { data, isLoading } = useQuery({
		queryKey: [QUERY_KEYS.DASHBOARD_DATA],
		queryFn: fetchDashboardData,
	});

	const { data: txResult, isLoading: loadingTx } = useQuery({
		queryKey: [QUERY_KEYS.TRANSACTION],
		queryFn: () => fetchTransactions({}, 1, 5),
	});

	const revenueDelta = data
		? ((data.totalRevenue - data.totalRevenueLastMonth) / data.totalRevenue) *
		  100
		: undefined;

	const txDelta = data
		? ((data.totalTransaction - data.totalTransactionLastMonth) /
				data.totalTransaction) *
		  100
		: undefined;

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>
					<p className='font-semibold'>Dashboard Overview</p>
				</Header>
			</StickyHeader>

			<div className='space-y-6'>
				<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<StatCard
						title='Total Collections'
						value={`P${numberWithCommas(data?.totalRevenue ?? 0)}`}
						delta={revenueDelta}
						icon={<Dollar />}
						isLoading={isLoading}
					/>
					<StatCard
						title='Total Transactions'
						value={numberWithCommas(data?.totalTransaction ?? 0)}
						delta={txDelta}
						icon={<Ledger />}
						isLoading={isLoading}
					/>
					<StatCard
						title='Total Students'
						value={numberWithCommas(data?.totalStudents ?? 0)}
						icon={<Person />}
						isLoading={isLoading}
					/>
					<StatCard
						title='Today’s Transactions'
						value={numberWithCommas(data?.transactionsToday ?? 0)}
						icon={<Today />}
						isLoading={isLoading}
					/>
				</div>

				<div className='grid gap-6 lg:grid-cols-3'>
					<div className='lg:col-span-2 rounded-2xl border bg-card/50 p-5 shadow-sm'>
						<h2 className='font-semibold mb-3'>Revenue Trend</h2>
						<BarCharts dashboardData={data} isLoading={isLoading} />
					</div>

					<div className='space-y-6'>
						<TransactionPieChart isLoading={isLoading} />
						<RecentTransactions data={txResult?.data} isLoading={loadingTx} />
					</div>
				</div>
			</div>
		</SidebarPageLayout>
	);
}
