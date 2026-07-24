import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { getYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { fetchSettings, updateSettings } from '@/api/setting';
import { AppSetting } from '@/types/appSetting';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import SchoolYearInput from '../SchoolYearInput';
import SemInput from '../SemInput';

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
      <section className="bg-card/40 border rounded-lg p-4 space-y-4 flex justify-center items-center h-40">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  return (
    <Card className="bg-card/40 shadow-none">
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>
          Configure the default global active school year and semester for the
          system.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <SchoolYearInput />

        <SemInput />

        {currentUser?.studentID === '2301106533' && (
          <div className="space-y-1 pt-4 border-t">
            <Label>Healthcheck Message (Admin Only)</Label>
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

        <div className="flex justify-end pt-2">
          <Button
            className="rounded-full"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !settings}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save Application Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
