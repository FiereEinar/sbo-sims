import { fetchCategories } from '@/api/category';
import { fetchPrelistingByID } from '@/api/prelisting';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeletePrelistingButton from '@/components/buttons/EditAndDeletePrelistingButton';
import BouncyLoading from '@/components/loading/BouncyLoading';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import PrelistingCheque from '@/components/PrelistingCheque';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function PrelistingInfo() {
	const userRole = useUserStore((state) => state.user?.role);
	const { prelistingID } = useParams();
	if (!prelistingID) return;

	const {
		data: prelisting,
		isLoading: PLoading,
		error: PError,
	} = useQuery({
		queryKey: [QUERY_KEYS.PRELISTING, { prelistingID }],
		queryFn: () => fetchPrelistingByID(prelistingID),
	});

	const {
		data: categories,
		isLoading: CLoading,
		error: CError,
	} = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	if (PError || CError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			{CLoading || (PLoading && <StickyHeaderLoading />)}
			{categories && prelisting && (
				<StickyHeader>
					<Header>Prelisting Details</Header>
					{isAuthorized(userRole, 'governor', 'treasurer', 'auditor') && (
						<EditAndDeletePrelistingButton
							categories={categories}
							prelisting={prelisting}
						/>
					)}
				</StickyHeader>
			)}
			<hr />
			{CLoading || (PLoading && <BouncyLoading />)}
			{prelisting && <PrelistingCheque prelisting={prelisting} />}
		</SidebarPageLayout>
	);
}
