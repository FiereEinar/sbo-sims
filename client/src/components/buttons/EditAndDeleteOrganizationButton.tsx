import { MODULES } from '@/constants';
import AddOrganizationForm from '../forms/AddOrganizationForm';
import HasPermission from '../HasPermission';

type EditAndDeleteOrganizationButtonProps = {
  organizationID: string;
};

export default function EditAndDeleteOrganizationButton({
  organizationID,
}: EditAndDeleteOrganizationButtonProps) {
	return (
		<div className="flex">
			<HasPermission permissions={[MODULES.ORGANIZATION_UPDATE]}>
				<EditButton organizationID={organizationID} />
			</HasPermission>
		</div>
	);
}

function EditButton({ organizationID }: EditAndDeleteOrganizationButtonProps) {
  return <AddOrganizationForm mode="edit" organizationID={organizationID} />;
}
