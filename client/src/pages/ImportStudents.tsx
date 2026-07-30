import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Import, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { APIResponse } from '@/types/api-response';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import BackButton from '@/components/buttons/BackButton';

type ImportResult = {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
};

type PreviewItem = {
  rowNum: number;
  studentID: string;
  firstname: string;
  lastname: string;
  middlename: string;
  course: string;
  year: number;
  gender: string;
  section: string;
  email: string;
  status: 'valid' | 'error' | 'exists';
  error?: string;
};

type PreviewResult = {
  valid: PreviewItem[];
  invalid: PreviewItem[];
  existing: PreviewItem[];
  totalRows: number;
  detectedColumns: {
    studentID?: string;
    name?: string;
    firstname?: string;
    lastname?: string;
    course?: string;
    year?: string;
    gender?: string;
    section?: string;
    email?: string;
  };
};

type Step = 'select' | 'preview' | 'result';

type SyncSource = {
  course: string;
  count: number;
};

export default function ImportStudents() {
  const { toast } = useToast();

  // File Import State
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sync State
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // ─── FILE IMPORT LOGIC ───────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await axiosInstance.post<APIResponse<PreviewResult>>(
        '/student/import/preview',
        formData,
      );

      setPreviewData(data.data);
      setStep('preview');
    } catch (err: any) {
      console.error('Failed to preview file', err);
      toast({
        variant: 'destructive',
        title: 'Failed to preview file',
        description:
          err.response?.data?.message || err.message || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('skipExisting', 'true');

      const { data } = await axiosInstance.post<APIResponse<ImportResult>>(
        '/student/import/smart',
        formData,
      );

      setImportResult(data.data);
      setStep('result');

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT_COURSES] });

      if (data.data.failed === 0) {
        toast({
          title: 'Import successful!',
          description: `${data.data.success} students imported, ${data.data.skipped} skipped.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Import completed with errors',
          description: `${data.data.success} added, ${data.data.skipped} skipped, ${data.data.failed} failed.`,
        });
      }
    } catch (err: any) {
      console.error('Failed to import file', err);
      toast({
        variant: 'destructive',
        title: 'Failed to import file',
        description:
          err.response?.data?.message || err.message || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    setPreviewData(null);
    setSelectedFile(null);
  };

  const handleReset = () => {
    setStep('select');
    setPreviewData(null);
    setImportResult(null);
    setSelectedFile(null);
  };

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-600">New</Badge>;
      case 'exists':
        return <Badge variant="secondary">Exists</Badge>;
      case 'error':
        return <Badge variant="destructive">{error}</Badge>;
      default:
        return null;
    }
  };

  // ─── SYNC LOGIC ──────────────────────────────────────────────────────────

  const { data: syncSourcesResponse, isLoading: isSyncLoading } = useQuery({
    queryKey: ['sync-sources'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<APIResponse<SyncSource[]>>(
        '/student/sync-sources',
      );
      return data;
    },
  });

  const syncSources = syncSourcesResponse?.data || [];

  const syncMutation = useMutation({
    mutationFn: async (courses: string[]) => {
      const { data } = await axiosInstance.post<
        APIResponse<{ matched: number; upserted: number; modified: number }>
      >('/student/sync', { courses });
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT_COURSES] });
      toast({
        title: 'Sync completed!',
        description: `Upserted ${result.upserted} students, modified ${result.modified} out of ${result.matched} total.`,
      });
      setSelectedCourses([]);
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: err.response?.data?.message || err.message,
      });
    },
  });

  const handleSyncSubmit = () => {
    if (selectedCourses.length === 0) return;
    syncMutation.mutate(selectedCourses);
  };

  return (
    <SidebarPageLayout>
      <BackButton />

      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Import Students</h1>
          <p className="text-muted-foreground text-sm">
            Add students to your masterlist via file upload or organization
            sync.
          </p>
        </div>
      </div>

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="file">File Import</TabsTrigger>
          <TabsTrigger value="sync">Sync from Orgs</TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-6">
          <div className="border rounded-xl p-6">
            {step === 'select' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Excel/CSV File</Label>
                  <div>
                    <Button
                      disabled={isLoading}
                      variant="outline"
                      className="w-full p-0 h-16 border-dashed"
                      asChild
                    >
                      <label
                        className="size-full flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        htmlFor="student-file-input"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading preview...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Import className="w-4 h-4" />
                            Choose File (.xlsx, .csv)
                          </span>
                        )}
                      </label>
                    </Button>
                    <input
                      onChange={handleFileSelect}
                      hidden
                      type="file"
                      id="student-file-input"
                      accept=".xlsx,.xls,.csv"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-2 border rounded-md p-4 bg-muted/30">
                  <p className="font-semibold text-foreground">
                    Auto-detected columns:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Student ID from: email, studentID, id columns</li>
                    <li>
                      Extracts ID from emails (e.g.,
                      2501114807@student.buksu.edu.ph)
                    </li>
                    <li>Name from: name, firstname, lastname columns</li>
                    <li>Course, Year, Gender, Section auto-detected</li>
                    <li>Existing students will be skipped (not duplicated)</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 'preview' && previewData && (
              <div className="flex flex-col space-y-6">
                {/* Detected columns */}
                <div className="p-3 bg-muted/30 rounded-md text-xs flex flex-wrap gap-3 border">
                  <span className="font-semibold text-foreground">
                    Detected:
                  </span>
                  {previewData.detectedColumns.studentID && (
                    <span>ID: "{previewData.detectedColumns.studentID}"</span>
                  )}
                  {previewData.detectedColumns.name && (
                    <span>Name: "{previewData.detectedColumns.name}"</span>
                  )}
                  {previewData.detectedColumns.firstname && (
                    <span>
                      First: "{previewData.detectedColumns.firstname}"
                    </span>
                  )}
                  {previewData.detectedColumns.lastname && (
                    <span>Last: "{previewData.detectedColumns.lastname}"</span>
                  )}
                  {previewData.detectedColumns.course && (
                    <span>Course: "{previewData.detectedColumns.course}"</span>
                  )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-xl bg-green-500/10 border-green-500/20">
                    <p className="text-sm text-green-600 font-medium">
                      New Students
                    </p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-500">
                      {previewData.valid.length}
                    </p>
                  </div>
                  <div className="p-4 border rounded-xl bg-yellow-500/10 border-yellow-500/20">
                    <p className="text-sm text-yellow-600 font-medium">
                      Already Exist
                    </p>
                    <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">
                      {previewData.existing.length}
                    </p>
                  </div>
                  <div className="p-4 border rounded-xl bg-red-500/10 border-red-500/20">
                    <p className="text-sm text-red-600 font-medium">Invalid</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-500">
                      {previewData.invalid.length}
                    </p>
                  </div>
                  <div className="p-4 border rounded-xl bg-blue-500/10 border-blue-500/20">
                    <p className="text-sm text-blue-600 font-medium">
                      Total Rows
                    </p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">
                      {previewData.totalRows}
                    </p>
                  </div>
                </div>

                {/* Table */}
                <div className="border rounded-md max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ...previewData.valid,
                        ...previewData.existing,
                        ...previewData.invalid,
                      ]
                        .sort((a, b) => a.rowNum - b.rowNum)
                        .map((item) => (
                          <TableRow key={item.rowNum}>
                            <TableCell className="text-muted-foreground">
                              {item.rowNum}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-medium">
                              {item.studentID || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.firstname} {item.middlename} {item.lastname}
                            </TableCell>
                            <TableCell>{item.course || '-'}</TableCell>
                            <TableCell>{item.year}</TableCell>
                            <TableCell>
                              {getStatusBadge(item.status, item.error)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Back to Selection
                  </Button>
                  <Button
                    onClick={handleConfirmImport}
                    disabled={isLoading || previewData.valid.length === 0}
                    className="min-w-[200px]"
                  >
                    {isLoading
                      ? 'Importing...'
                      : `Import ${previewData.valid.length} New Students`}
                  </Button>
                </div>
              </div>
            )}

            {step === 'result' && importResult && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                    <Import className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold">Import Completed</h2>
                  <p className="text-muted-foreground">
                    Your student data has been processed.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 border rounded-xl bg-green-500/10 border-green-500/20 text-center">
                    <p className="text-4xl font-bold text-green-600 mb-1">
                      {importResult.success}
                    </p>
                    <p className="text-sm font-medium text-green-700/80 dark:text-green-500/80 uppercase tracking-wider">
                      Imported
                    </p>
                  </div>
                  <div className="p-6 border rounded-xl bg-yellow-500/10 border-yellow-500/20 text-center">
                    <p className="text-4xl font-bold text-yellow-600 mb-1">
                      {importResult.skipped}
                    </p>
                    <p className="text-sm font-medium text-yellow-700/80 dark:text-yellow-500/80 uppercase tracking-wider">
                      Skipped
                    </p>
                  </div>
                  <div className="p-6 border rounded-xl bg-red-500/10 border-red-500/20 text-center">
                    <p className="text-4xl font-bold text-red-600 mb-1">
                      {importResult.failed}
                    </p>
                    <p className="text-sm font-medium text-red-700/80 dark:text-red-500/80 uppercase tracking-wider">
                      Failed
                    </p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
                    <p className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Error Details ({importResult.errors.length})
                    </p>
                    <div className="max-h-48 overflow-auto rounded border bg-background/50 p-3">
                      <ul className="text-sm text-red-600/90 space-y-1.5 font-mono">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-6">
                  <Button onClick={handleReset} size="lg" className="px-8">
                    Import Another File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sync">
          <div className="border rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1">
                Sync from Organizations
              </h2>
              <p className="text-sm text-muted-foreground">
                Select courses from allowed parent/child organizations to sync
                their student masterlists into your organization.
              </p>
            </div>

            {isSyncLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin mb-4 opacity-50" />
                <p>Loading available courses...</p>
              </div>
            ) : syncSources.length === 0 ? (
              <div className="text-center py-12 border rounded-xl bg-muted/30 border-dashed">
                <p className="text-foreground font-medium mb-1">
                  No sync sources available
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your organization has no designated sync sources, or there are
                  no students enrolled in the allowed organizations for this
                  term.
                  <br />
                  <br />
                  Central Administrators can assign sync sources via the
                  organization settings.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <Checkbox
                            checked={
                              selectedCourses.length === syncSources.length &&
                              syncSources.length > 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCourses(
                                  syncSources.map((s) => s.course),
                                );
                              } else {
                                setSelectedCourses([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Course Code</TableHead>
                        <TableHead className="text-right">
                          Available Students
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncSources.map((source) => (
                        <TableRow key={source.course}>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedCourses.includes(source.course)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCourses([
                                    ...selectedCourses,
                                    source.course,
                                  ]);
                                } else {
                                  setSelectedCourses(
                                    selectedCourses.filter(
                                      (c) => c !== source.course,
                                    ),
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            {source.course || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {source.count} students
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedCourses.length} course(s) selected
                  </p>
                  <Button
                    onClick={handleSyncSubmit}
                    disabled={
                      selectedCourses.length === 0 || syncMutation.isPending
                    }
                    className="min-w-[150px]"
                  >
                    {syncMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      'Sync Students'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </SidebarPageLayout>
  );
}
