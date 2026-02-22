import { OrganizationWithCategory } from '@/types/organization';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import {
	Building2,
	Crown,
	User,
	Wallet,
	ShieldCheck,
	FolderKanban,
} from 'lucide-react';

interface OrganizationCardProps {
	organization: OrganizationWithCategory;
}

export default function OrganizationCard({
	organization,
}: OrganizationCardProps) {
	const navigate = useNavigate();

	return (
		<div
			onClick={() => navigate(`/organization/${organization._id}`)}
			className='cursor-pointer rounded-2xl border p-5 bg-card/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-'
		>
			{/* Header */}
			<div className='flex justify-between items-start gap-4'>
				<div className='flex items-center gap-2'>
					<Building2 size={24} className='text-muted-foreground' />
					<h3 className='font-semibold text-lg'>{organization.name}</h3>
				</div>

				<div className='flex items-center gap-1 text-sm font-medium'>
					<FolderKanban size={16} className='text-muted-foreground' />
					<span>{organization.categories?.length ?? 0}</span>
				</div>
			</div>

			{/* Officers */}
			<div className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
				<div className='flex items-center gap-2'>
					<Crown size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Governor</p>
						<p>{_.startCase(organization.governor)}</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<User size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Vice Governor</p>
						<p>{_.startCase(organization.viceGovernor)}</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<Wallet size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Treasurer</p>
						<p>{_.startCase(organization.treasurer)}</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<ShieldCheck size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Auditor</p>
						<p>{_.startCase(organization.auditor)}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
