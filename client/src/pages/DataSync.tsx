import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AVAILABLE_SCHOOL_YEARS } from '@/constants';
import { CloudDownload, CloudUpload, Loader2 } from 'lucide-react';
import SidebarPageLayout from '@/components/SidebarPageLayout';

const TERM_MODULES = [
  { id: 'Student', label: 'Students' },
  { id: 'Transaction', label: 'Transactions' },
  { id: 'Category', label: 'Categories' },
  { id: 'Prelisting', label: 'Prelistings' },
  { id: 'Event', label: 'Events (includes Sessions & Attendance)' },
  { id: 'Gpoa', label: 'GPOAs' },
  { id: 'PaymentRequest', label: 'Payment Requests' },
];

const GLOBAL_MODULES = [
  { id: 'User', label: 'Users' },
  { id: 'Role', label: 'Roles' },
];

export default function DataSync() {
  const { toast } = useToast();
  const [semester, setSemester] = useState<string>('1');
  const [schoolYear, setSchoolYear] = useState<string>('2024-2025');
  const [selectedTermModules, setSelectedTermModules] = useState<string[]>([]);
  const [selectedGlobalModules, setSelectedGlobalModules] = useState<string[]>(
    [],
  );
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    if ((window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const handleSelectAllTerm = (checked: boolean) => {
    if (checked) {
      setSelectedTermModules(TERM_MODULES.map((m) => m.id));
    } else {
      setSelectedTermModules([]);
    }
  };

  const handleSelectAllGlobal = (checked: boolean) => {
    if (checked) {
      setSelectedGlobalModules(GLOBAL_MODULES.map((m) => m.id));
    } else {
      setSelectedGlobalModules([]);
    }
  };

  const toggleTermModule = (id: string) => {
    setSelectedTermModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const toggleGlobalModule = (id: string) => {
    setSelectedGlobalModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleForceSync = async (action: 'push' | 'pull') => {
    if (!(window as any).electronAPI) {
      toast({
        title: 'Electron Only',
        description: 'Force sync is only available on the desktop app.',
        variant: 'destructive',
      });
      return;
    }

    let modules = [...selectedTermModules, ...selectedGlobalModules];
    if (modules.includes('Event')) {
      modules.push('EventSession', 'AttendanceRecord');
    }
    if (modules.length === 0) {
      toast({
        title: 'No modules selected',
        description: 'Please select at least one module to sync.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (action === 'push') setIsPushing(true);
      else setIsPulling(true);

      const payload = {
        modules,
        ...(selectedTermModules.length > 0 ? { semester, schoolYear } : {}),
      };

      const result = await (window as any).electronAPI.invoke(
        action === 'push' ? 'sync:force-push' : 'sync:force-pull',
        payload,
      );

      toast({
        title: 'Sync Complete',
        description: `Successfully ${action === 'push' ? 'pushed' : 'pulled'} ${
          result.totalUpserted || result.totalApplied || 0
        } records.`,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsPushing(false);
      setIsPulling(false);
    }
  };

  if (!isElectron) {
    return (
      <SidebarPageLayout>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Sync</h1>
          <p className="text-muted-foreground mt-2">
            Advanced synchronization controls.
          </p>
        </div>
        <Card className="max-w-4xl space-y-6 border bg-card/50">
          <CardHeader>
            <CardTitle>Desktop App Required</CardTitle>
            <CardDescription>
              The advanced force sync feature is only available on the desktop
              application.
            </CardDescription>
          </CardHeader>
        </Card>
      </SidebarPageLayout>
    );
  }

  return (
    <SidebarPageLayout>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Sync</h1>
        <p className="text-muted-foreground mt-2">
          Manually push local data to the cloud or pull missing data from the
          cloud.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border bg-card/50">
          <CardHeader>
            <CardTitle>Term-Based Modules</CardTitle>
            <CardDescription>
              Data that requires a specific semester and school year.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Semester</label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Semester</SelectItem>
                    <SelectItem value="2">2nd Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">School Year</label>
                <Select value={schoolYear} onValueChange={setSchoolYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school year" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SCHOOL_YEARS.map((year) => (
                      <SelectItem key={year} value={`${year}-${year + 1}`}>
                        {year}-{year + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-term"
                  checked={
                    selectedTermModules.length === TERM_MODULES.length &&
                    TERM_MODULES.length > 0
                  }
                  onCheckedChange={handleSelectAllTerm}
                />
                <label
                  htmlFor="select-all-term"
                  className="text-sm font-bold cursor-pointer"
                >
                  Select All Term Modules
                </label>
              </div>
              {TERM_MODULES.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center space-x-2 ml-4"
                >
                  <Checkbox
                    id={`term-${module.id}`}
                    checked={selectedTermModules.includes(module.id)}
                    onCheckedChange={() => toggleTermModule(module.id)}
                  />
                  <label
                    htmlFor={`term-${module.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {module.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-card/50">
          <CardHeader>
            <CardTitle>Global Modules</CardTitle>
            <CardDescription>
              Organization-wide data that is not tied to a term.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-global"
                  checked={
                    selectedGlobalModules.length === GLOBAL_MODULES.length &&
                    GLOBAL_MODULES.length > 0
                  }
                  onCheckedChange={handleSelectAllGlobal}
                />
                <label
                  htmlFor="select-all-global"
                  className="text-sm font-bold cursor-pointer"
                >
                  Select All Global Modules
                </label>
              </div>
              {GLOBAL_MODULES.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center space-x-2 ml-4"
                >
                  <Checkbox
                    id={`global-${module.id}`}
                    checked={selectedGlobalModules.includes(module.id)}
                    onCheckedChange={() => toggleGlobalModule(module.id)}
                  />
                  <label
                    htmlFor={`global-${module.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {module.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          disabled={isPushing || isPulling}
          onClick={() => handleForceSync('pull')}
        >
          {isPulling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CloudDownload className="mr-2 h-4 w-4" />
          )}
          Force Pull from Cloud
        </Button>
        <Button
          disabled={isPushing || isPulling}
          onClick={() => handleForceSync('push')}
        >
          {isPushing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CloudUpload className="mr-2 h-4 w-4" />
          )}
          Force Push to Cloud
        </Button>
      </div>
    </SidebarPageLayout>
  );
}
