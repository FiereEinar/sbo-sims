import ApplicationSettingsForm from '@/components/forms/ApplicationSettingsForm';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="p-8 min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Global Settings
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Configure the default school year and semester for all new sessions.
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ApplicationSettingsForm />
      </div>
    </div>
  );
}
