import { OrganizationWithCategory } from '@/types/organization';
import OrganizationCard from './cards/OrganizationCard';

interface OrganizationsCardViewProps {
	organizations?: OrganizationWithCategory[];
	isLoading: boolean;
}

export default function OrganizationsCardView({
	organizations,
	isLoading,
}: OrganizationsCardViewProps) {
	if (isLoading) {
		return (
			<div className='grid gap-6 sm:grid-cols-1 lg:grid-cols-1'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='rounded-2xl border p-6 shadow-sm animate-pulse h-48'
					/>
				))}
			</div>
		);
	}

	if (!organizations?.length) {
		return (
			<div className='text-center py-10 text-muted-foreground'>
				No organizations found
			</div>
		);
	}

	return (
		<div className='grid gap-4 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1'>
			{organizations.map((org) => (
				<OrganizationCard key={org._id} organization={org} />
			))}
		</div>
	);
}
