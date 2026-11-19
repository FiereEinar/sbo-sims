import SidebarPageLayout from '@/components/SidebarPageLayout';
import HasPermission from '@/components/HasPermission';
import { MODULES } from '@/constants';
import SettingsTabs from '@/components/SettingsTabs';
import OrgEmailConfigForm from '@/components/forms/OrgEmailConfigForm';

export default function EmailSettings() {
  return (
    <SidebarPageLayout>
      <div className="w-full space-y-6 mx-auto">
        <SettingsTabs />

        <HasPermission permissions={[MODULES.ORGANIZATION_UPDATE]}>
          <OrgEmailConfigForm />
        </HasPermission>
      </div>
    </SidebarPageLayout>
  );
}
