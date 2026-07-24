import { useState } from 'react';
import ApplicationSettingsForm from '@/components/forms/ApplicationSettingsForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import HasPermission from '@/components/HasPermission';
import { MODULES } from '@/constants';
import SettingsTabs from '@/components/SettingsTabs';
import AppearanceSettingsForm from '@/components/forms/AppearanceSettingsForm';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('application');
  return (
    <SidebarPageLayout>
      <div className="w-full max-w-5xl space-y-6">
        <SettingsTabs />

        <div className="flex border-b border-border/50">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'application' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('application')}
          >
            Application
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
        </div>

        <HasPermission permissions={[MODULES.SETTING_UPDATE]}>
          {activeTab === 'application' && <ApplicationSettingsForm />}
          {activeTab === 'appearance' && <AppearanceSettingsForm />}
        </HasPermission>
      </div>
    </SidebarPageLayout>
  );
}
