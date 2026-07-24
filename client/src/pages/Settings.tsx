import SidebarPageLayout from '@/components/SidebarPageLayout';
import HasPermission from '@/components/HasPermission';
import { MODULES } from '@/constants';
import SettingsTabs from '@/components/SettingsTabs';
import AppearanceSettingsForm from '@/components/forms/AppearanceSettingsForm';

export default function Settings() {
  return (
    <SidebarPageLayout>
      <div className="w-full max-w-5xl space-y-6">
        <SettingsTabs />

        <HasPermission permissions={[MODULES.SETTING_UPDATE]}>
          <AppearanceSettingsForm />
        </HasPermission>
      </div>
    </SidebarPageLayout>
  );
}
