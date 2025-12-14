import { Organization } from '@/types/organization';
import { Badge } from './ui/badge';
import _ from 'lodash';
import { Briefcase, Users } from 'lucide-react';

type OrganizationDetailsProps = {
	organization: Organization;
};

export default function OrganizationDetails({
	organization,
}: OrganizationDetailsProps) {
	return (
		<div className='rounded-2xl border bg-card/50 p-6 shadow-sm space-y-4'>
			<div>
				<h2 className='text-xl font-semibold'>Leadership</h2>
				<p className='text-sm text-muted-foreground'>
					Current organization officers
				</p>
			</div>

			<div className='grid gap-4 sm:grid-cols-2'>
				<Officer label='Governor' value={organization.governor} />
				<Officer label='Vice Governor' value={organization.viceGovernor} />
				<Officer label='Treasurer' value={organization.treasurer} />
				<Officer label='Auditor' value={organization.auditor} />
			</div>

			<div className='pt-2 space-y-2'>
				<div className='flex items-center gap-2 text-muted-foreground'>
					<Briefcase size={16} />
					<span>Departments</span>
				</div>

				<div className='flex flex-wrap gap-2'>
					{organization.departments.map((department) => (
						<Badge key={department} variant='secondary'>
							{department}
						</Badge>
					))}
				</div>
			</div>
		</div>
	);
}

interface OfficerProps {
	label: string;
	value: string;
}

function Officer({ label, value }: OfficerProps) {
	return (
		<div className='flex items-center gap-3'>
			<div className='h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary'>
				<Users size={16} />
			</div>
			<div>
				<p className='text-xs text-muted-foreground'>{label}</p>
				<p className='font-medium'>{_.startCase(value)}</p>
			</div>
		</div>
	);
}
