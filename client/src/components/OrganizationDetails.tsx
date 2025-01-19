import { Organization } from '@/types/organization';
import { Badge } from './ui/badge';
import _ from 'lodash';

type OrganizationDetailsProps = {
	organization: Organization;
};

export default function OrganizationDetails({
	organization,
}: OrganizationDetailsProps) {
	return (
		<div>
			<p className='text-muted-foreground'>
				Governor: {_.startCase(organization.governor)}
			</p>
			<p className='text-muted-foreground'>
				Vice Governor: {_.startCase(organization.viceGovernor)}
			</p>
			<p className='text-muted-foreground'>
				Treasurer: {_.startCase(organization.treasurer)}
			</p>
			<p className='text-muted-foreground'>
				Auditor: {_.startCase(organization.auditor)}
			</p>
			<div className='text-muted-foreground flex gap-1 my-1'>
				<span>Departments:</span>
				{organization.departments.map((department, i) => (
					<Badge key={i}>{department}</Badge>
				))}
			</div>
		</div>
	);
}
