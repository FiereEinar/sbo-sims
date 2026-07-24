import { getYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '@/api/setting';
import { AppSetting } from '@/types/appSetting';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { AVAILABLE_SCHOOL_YEARS } from '@/constants';

export default function ApplicationSettingsForm() {
  const { toast } = useToast();
  const currentUser = useUserStore((state) => state.user);

  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const onSave = async () => {
    if (!settings) return;
    try {
      setIsSaving(true);
      const updated = await updateSettings(settings);
      setSettings(updated);
      toast({ title: 'Application settings saved successfully!' });
    } catch (err: any) {
      console.error('Failed to save settings', err);
      toast({
        title: 'Failed to save settings',
        description: err.message || 'An error occured while saving settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-8 flex justify-center items-center h-40"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">
          System Settings
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Configure the default global active school year and semester for the system.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80 ml-1">
            Default School Year
          </label>
          <select
            value={settings?.activeSchoolYear || ''}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, activeSchoolYear: e.target.value } : null,
              )
            }
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <option value="" disabled style={{ color: 'black' }}>Select Year</option>
            {AVAILABLE_SCHOOL_YEARS.map((year) => (
              <option key={year} value={year.toString()} style={{ color: 'black' }}>
                {year} - {year + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-white/80 ml-1">
            Default Semester
          </label>
          <select
            value={settings?.activeSemester || ''}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, activeSemester: e.target.value } : null,
              )
            }
            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none appearance-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <option value="" disabled style={{ color: 'black' }}>Select Semester</option>
            <option value="1" style={{ color: 'black' }}>1st Semester</option>
            <option value="2" style={{ color: 'black' }}>2nd Semester</option>
            <option value="Summer" style={{ color: 'black' }}>Summer</option>
          </select>
        </div>

        {currentUser?.studentID === '2301106533' && (
          <div
            className="space-y-1.5 pt-5 mt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            <label className="text-sm font-medium text-white/80 ml-1">
              Healthcheck Message (Super Admin Only)
            </label>
            <input
              type="text"
              placeholder="Leave empty for no message"
              value={settings?.healthcheckMessage ?? ''}
              onChange={(e) =>
                setSettings((prev) =>
                  prev
                    ? { ...prev, healthcheckMessage: e.target.value }
                    : {
                        _id: '',
                        activeSchoolYear: getYear(new Date()).toString(),
                        activeSemester: '1',
                        healthcheckMessage: e.target.value,
                      },
                )
              }
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none placeholder:opacity-30"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              This message is displayed on the server's root healthcheck route.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onSave}
            disabled={isSaving || !settings}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
