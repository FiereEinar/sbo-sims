import { getYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '@/api/setting';
import { AppSetting } from '@/types/appSetting';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';
import { AVAILABLE_SCHOOL_YEARS } from '@/constants';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      <div className="rounded-2xl p-8 flex justify-center items-center h-40 bg-card/40 border border-muted-foreground/15">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-card/40 border border-muted-foreground/15">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1">
          System Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure the default global active school year and semester for the
          system.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Default School Year
          </Label>
          <Select
            value={settings?.activeSchoolYear || ''}
            onValueChange={(value) =>
              setSettings((prev) =>
                prev ? { ...prev, activeSchoolYear: value } : null,
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_SCHOOL_YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year} - {year + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Default Semester
          </Label>
          <Select
            value={settings?.activeSemester || ''}
            onValueChange={(value) =>
              setSettings((prev) =>
                prev ? { ...prev, activeSemester: value } : null,
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Semester</SelectItem>
              <SelectItem value="2">2nd Semester</SelectItem>
              <SelectItem value="Summer">Summer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentUser?.studentID === '2301106533' && (
          <div className="space-y-2 pt-5 mt-5 border-t border-border">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Healthcheck Message (Super Admin Only)
            </Label>
            <Input
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
            />
            <p className="text-xs text-muted-foreground">
              This message is displayed on the server's root healthcheck route.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={onSave}
            disabled={isSaving || !settings}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
