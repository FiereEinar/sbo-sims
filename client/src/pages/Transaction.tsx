import { fetchCategories } from '@/api/category';
import { fetchAvailableCourses } from '@/api/student';
import { fetchTransactions } from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsFilter from '@/components/TransactionsFilter';
import TransactionsTable from '@/components/TransactionsTable';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/header';
import { TransactionsFilterValues } from '@/types/transaction';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Transaction() {
	const defaultFilterValue = 'All';
	const [page, setPage] = useState(1);
	const pageSize = 50;

	const [period, setPeriod] = useState<TransactionsFilterValues['period']>();
	const [status, setStatus] = useState<TransactionsFilterValues['status']>();
	const [category, setCategory] =
		useState<TransactionsFilterValues['category']>();
	const [date, setDate] = useState<TransactionsFilterValues['date']>();
	// const [search, setSearch] = useState<TransactionsFilterValues['search']>();
	const [course, setCourse] =
		useState<TransactionsFilterValues['course']>(defaultFilterValue);

	const {
		data: fetchTransactionsResult,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [
			'transactions',
			{ course, page, pageSize, date, category, status, period },
		],
		queryFn: () =>
			fetchTransactions(
				{ course, date, category, status, period },
				page,
				pageSize
			),
	});

	const {
		data: categories,
		isLoading: categoriesLoading,
		error: categoriesError,
	} = useQuery({
		queryKey: ['categories'],
		queryFn: fetchCategories,
	});

	const {
		data: courses,
		isLoading: cLoading,
		error: cError,
	} = useQuery({
		queryKey: ['students_courses'],
		queryFn: fetchAvailableCourses,
	});

	if (categoriesLoading || cLoading) {
		return <p>Loading...</p>;
	}

	if (transactionsError || categoriesError || cError || !categories) {
		return <p>Error</p>;
	}

	console.log(fetchTransactionsResult);

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Transactions List</Header>
				<AddTransactionForm categories={categories} />
			</StickyHeader>

			<div className='flex justify-between items-end flex-wrap gap-3'>
				<TransactionsFilter
					categories={categories}
					courses={[defaultFilterValue].concat(courses ?? [])}
					onChange={(filters) => {
						// setSearch(filters.search);
						setStatus(filters.status);
						setPeriod(filters.period);
						setCategory(filters.category);
						setDate(filters.date);
						setCourse(
							filters.course === defaultFilterValue ? undefined : filters.course
						);
					}}
				/>
				<Button variant='secondary'>Download</Button>
			</div>
			<TransactionsTable
				isLoading={transactionsLoading}
				transactions={fetchTransactionsResult?.data}
			/>
		</SidebarPageLayout>
	);
}
