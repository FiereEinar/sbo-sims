import { fetchCategories } from '@/api/category';
import { fetchPrelistings } from '@/api/prelisting';
import AddPrelistingForm from '@/components/forms/AddPrelistingForm';
import HasPermission from '@/components/HasPermission';
import PaginationController from '@/components/PaginationController';
import PrelistingFilter from '@/components/PrelistingFilter';
import PrelistingTable from '@/components/PrelistingTable';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { usePrelistingFilterStore } from '@/store/prelistingFilter';
import { PrelistingFilterValues } from '@/types/prelisting';
import { useQuery } from '@tanstack/react-query';

export default function Prelisting() {
	const { page, pageSize, getFilterValues, setPage } = usePrelistingFilterStore(
		(state) => state,
	);

	const {
		data: fetchPrelistingsResult,
		isLoading: prelistingLoading,
		error: prelistingError,
	} = useQuery({
		queryKey: [QUERY_KEYS.PRELISTING, getFilterValues()],
		queryFn: () => fetchPrelistings(getFilterValues(), page, pageSize),
	});

	const { data: categories, error: categoriesError } = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	const prefetchPageFn = (page: number) => {
		const filters: PrelistingFilterValues = {
			...getFilterValues(),
			page: page,
		};

		// check if it was already prefetched
		const data = queryClient.getQueryData([QUERY_KEYS.PRELISTING, filters]);
		if (data) return;

		queryClient.prefetchQuery({
			queryKey: [QUERY_KEYS.PRELISTING, filters],
			queryFn: () => fetchPrelistings(filters, page, pageSize),
		});
	};

	if (prelistingError || categoriesError) {
		return <p>Session expired, login again.</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Prelistings</Header>

				<HasPermission permissions={[MODULES.PRELISTING_CREATE]}>
					<AddPrelistingForm categories={categories} />
				</HasPermission>
			</StickyHeader>

			<div className='flex justify-between items-end flex-wrap gap-3'>
				<PrelistingFilter />
			</div>
			<PrelistingTable
				isLoading={prelistingLoading}
				prelistings={fetchPrelistingsResult?.data}
			/>

			{fetchPrelistingsResult && (
				<PaginationController
					currentPage={page ?? 1}
					nextPage={fetchPrelistingsResult.next}
					prevPage={fetchPrelistingsResult.prev}
					setPage={setPage}
					prefetchFn={prefetchPageFn}
				/>
			)}
		</SidebarPageLayout>
	);
}
