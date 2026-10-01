import { useState } from 'react';
import {
  Import,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { EventSession } from '@/types/event';
import {
  AttendancePreviewResult,
  AttendanceImportResult,
  previewSessionAttendanceImport,
  importSessionAttendance,
} from '@/api/attendance';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';

type ImportAttendanceProps = {
  session: EventSession;
  onBack: () => void;
};

type Step = 'select' | 'preview' | 'result';

export default function ImportAttendance({
  session,
  onBack,
}: ImportAttendanceProps) {
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [allowUnmapped, setAllowUnmapped] = useState(true);
  const [previewData, setPreviewData] =
    useState<AttendancePreviewResult | null>(null);
  const [importResult, setImportResult] =
    useState<AttendanceImportResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'valid' | 'exists' | 'error'
  >('all');
  const [searchFilter, setSearchFilter] = useState('');

  // ─── File Selection & Preview ─────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const data = await previewSessionAttendanceImport(session._id, file);
      setPreviewData(data);
      setStep('preview');
      setFilterStatus('all');
      setSearchFilter('');
    } catch (err: any) {
      console.error('Failed to preview attendance file', err);
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

  // ─── Confirm Import ───────────────────────────────────────────────────────
  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);

    try {
      const result = await importSessionAttendance(
        session._id,
        selectedFile,
        allowUnmapped,
      );

      setImportResult(result);
      setStep('result');

      // Invalidate attendance queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT, session._id, 'attendance'],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT, session._id, 'attendance-stats'],
      });

      if (result.failed === 0) {
        toast({
          title: 'Import successful!',
          description: `${result.success} attendance records added, ${result.skipped} skipped.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Import completed with errors',
          description: `${result.success} added, ${result.skipped} skipped, ${result.failed} failed.`,
        });
      }
    } catch (err: any) {
      console.error('Failed to import attendance', err);
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description:
          err.response?.data?.message || err.message || 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('select');
    setPreviewData(null);
    setSelectedFile(null);
    setImportResult(null);
    setFilterStatus('all');
    setSearchFilter('');
  };

  const getStatusBadge = (status: string, error?: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-600 hover:bg-green-700">Ready</Badge>;
      case 'exists':
        return (
          <Badge
            variant="secondary"
            className="text-yellow-600 bg-yellow-500/10 border-yellow-500/20"
          >
            {error || 'Already Recorded'}
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">{error || 'Invalid'}</Badge>;
      default:
        return null;
    }
  };

  // Filter preview rows
  const allPreviewItems = previewData
    ? [...previewData.valid, ...previewData.existing, ...previewData.invalid]
    : [];

  const filteredItems = allPreviewItems
    .filter((item) => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.studentID.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.course && item.course.toLowerCase().includes(q)) ||
        (item.section && item.section.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.rowNum - b.rowNum);

  return (
    <div className="bg-card/50 border rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Import Attendance</h3>
              <p className="text-sm text-muted-foreground">
                Session:{' '}
                <span className="font-medium text-foreground">
                  {session.name}
                </span>
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="self-start sm:self-auto gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance Table
        </Button>
      </div>

      {/* Step 1: Select File */}
      {step === 'select' && (
        <div className="space-y-6 max-w-2xl mx-auto py-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Select Attendance Sheet (.xlsx, .xls, .csv)
            </Label>
            <p className="text-sm text-muted-foreground">
              Upload a spreadsheet with student IDs to record attendance for
              this session.
            </p>
            <div>
              <Button
                disabled={isLoading}
                variant="outline"
                className="w-full p-0 h-28 border-dashed border-2 hover:border-primary transition-colors"
                asChild
              >
                <label
                  className="size-full flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors gap-2"
                  htmlFor="attendance-file-input"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      Parsing file preview...
                    </span>
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                        <Import className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-foreground">
                        Click to browse file
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Supports Excel (.xlsx, .xls) and CSV (.csv)
                      </span>
                    </>
                  )}
                </label>
              </Button>
              <input
                onChange={handleFileSelect}
                hidden
                type="file"
                id="attendance-file-input"
                accept=".xlsx,.xls,.csv"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Unmapped Option */}
          <div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/20">
            <Checkbox
              id="allow-unmapped"
              checked={allowUnmapped}
              onCheckedChange={(checked) => setAllowUnmapped(!!checked)}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <label
                htmlFor="allow-unmapped"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Allow unmapped students
              </label>
              <p className="text-xs text-muted-foreground">
                If checked, student IDs not found in the organization's
                masterlist will still be recorded as unmapped attendance.
              </p>
            </div>
          </div>

          {/* Helper details */}
          <div className="text-sm text-muted-foreground space-y-2 border rounded-xl p-4 bg-muted/30">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Smart Auto-Detection Features:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1 text-xs">
              <li>
                <span className="font-medium text-foreground">
                  Student ID columns:
                </span>{' '}
                auto-detects from{' '}
                <code className="text-foreground">studentID</code>,{' '}
                <code className="text-foreground">id</code>,{' '}
                <code className="text-foreground">email</code>, or plain
                single-column lists.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Institutional Emails:
                </span>{' '}
                extracts student ID from emails (e.g.{' '}
                <code className="text-foreground">
                  2501114807@student.buksu.edu.ph
                </code>
                ).
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Automatic Student Info:
                </span>{' '}
                Name, course, year, and section are automatically looked up from
                your masterlist.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Duplicate Prevention:
                </span>{' '}
                Students already recorded present in this session will be safely
                skipped.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && previewData && (
        <div className="space-y-6">
          {/* Detected columns bar */}
          <div className="p-3 bg-muted/30 rounded-lg text-xs flex flex-wrap items-center gap-3 border">
            <span className="font-semibold text-foreground">
              Detected Columns:
            </span>
            {previewData.detectedColumns.studentID && (
              <Badge variant="outline" className="font-mono">
                ID: "{previewData.detectedColumns.studentID}"
              </Badge>
            )}
            {previewData.detectedColumns.name && (
              <Badge variant="outline">
                Name: "{previewData.detectedColumns.name}"
              </Badge>
            )}
            {previewData.detectedColumns.course && (
              <Badge variant="outline">
                Course: "{previewData.detectedColumns.course}"
              </Badge>
            )}
            {previewData.detectedColumns.year && (
              <Badge variant="outline">
                Year: "{previewData.detectedColumns.year}"
              </Badge>
            )}
            {previewData.detectedColumns.section && (
              <Badge variant="outline">
                Section: "{previewData.detectedColumns.section}"
              </Badge>
            )}
          </div>

          {/* Interactive Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => setFilterStatus('valid')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                filterStatus === 'valid'
                  ? 'bg-green-500/20 border-green-500 shadow-sm'
                  : 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
              }`}
            >
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Ready to Record
              </p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-500 mt-1">
                {previewData.valid.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                New attendance records
              </p>
            </div>

            <div
              onClick={() => setFilterStatus('exists')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                filterStatus === 'exists'
                  ? 'bg-yellow-500/20 border-yellow-500 shadow-sm'
                  : 'bg-yellow-500/5 border-yellow-500/20 hover:bg-yellow-500/10'
              }`}
            >
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">
                Already Recorded
              </p>
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500 mt-1">
                {previewData.existing.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Will be skipped
              </p>
            </div>

            <div
              onClick={() => setFilterStatus('error')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                filterStatus === 'error'
                  ? 'bg-red-500/20 border-red-500 shadow-sm'
                  : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
              }`}
            >
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                Invalid
              </p>
              <p className="text-3xl font-bold text-red-700 dark:text-red-500 mt-1">
                {previewData.invalid.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Missing student ID
              </p>
            </div>

            <div
              onClick={() => setFilterStatus('all')}
              className={`p-4 border rounded-xl cursor-pointer transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-500/20 border-blue-500 shadow-sm'
                  : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
              }`}
            >
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Total Rows
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-500 mt-1">
                {previewData.totalRows}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rows in uploaded file
              </p>
            </div>
          </div>

          {/* Search within preview table */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter preview by ID or name..."
                className="pl-9 h-9 text-sm"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredItems.length} of {allPreviewItems.length} rows
              {filterStatus !== 'all' && ` (filtered by ${filterStatus})`}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border rounded-xl max-h-[420px] overflow-auto">
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur">
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course & Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Masterlist</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No records match the current filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={`${item.rowNum}-${item.studentID}`}>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {item.rowNum}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">
                        {item.studentID || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.name || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.course
                          ? `${item.course} ${item.year ? `- ${item.year}` : ''}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.section || '-'}
                      </TableCell>
                      <TableCell>
                        {item.isMapped ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]"
                          >
                            Registered
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground text-[11px]"
                          >
                            Unmapped
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status, item.error)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t gap-3">
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={isLoading}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Selection
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={isLoading || previewData.valid.length === 0}
              className="min-w-[220px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Recording attendance...
                </span>
              ) : (
                `Record ${previewData.valid.length} Attendances`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
        <div className="space-y-6 max-w-xl mx-auto py-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold">Import Completed</h3>
            <p className="text-muted-foreground text-sm">
              Attendance records for{' '}
              <span className="font-semibold text-foreground">
                {session.name}
              </span>{' '}
              have been updated.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 border rounded-xl bg-green-500/10 border-green-500/20 text-center">
              <p className="text-3xl font-bold text-green-600 mb-1">
                {importResult.success}
              </p>
              <p className="text-xs font-semibold text-green-700/80 dark:text-green-500/80 uppercase tracking-wider">
                Recorded
              </p>
            </div>
            <div className="p-5 border rounded-xl bg-yellow-500/10 border-yellow-500/20 text-center">
              <p className="text-3xl font-bold text-yellow-600 mb-1">
                {importResult.skipped}
              </p>
              <p className="text-xs font-semibold text-yellow-700/80 dark:text-yellow-500/80 uppercase tracking-wider">
                Skipped
              </p>
            </div>
            <div className="p-5 border rounded-xl bg-red-500/10 border-red-500/20 text-center">
              <p className="text-3xl font-bold text-red-600 mb-1">
                {importResult.failed}
              </p>
              <p className="text-xs font-semibold text-red-700/80 dark:text-red-500/80 uppercase tracking-wider">
                Failed
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="border border-red-500/20 rounded-xl p-4 bg-red-500/5">
              <p className="font-semibold text-red-600 mb-2 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Error Details ({importResult.errors.length})
              </p>
              <div className="max-h-36 overflow-auto rounded border bg-background/50 p-2.5">
                <ul className="text-xs text-red-600/90 space-y-1 font-mono">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              Import Another File
            </Button>
            <Button onClick={onBack} className="w-full sm:w-auto gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Attendance Table
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
