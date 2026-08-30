import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Import, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { APIResponse } from '@/types/api-response';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import BackButton from '@/components/buttons/BackButton';
import { fetchCategories } from '@/api/category';

type ImportResult = {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
};

type PreviewItem = {
  rowNum: number;
  studentID: string;
  studentName?: string;
  nameFromFile?: string;
  amount: number;
  date: string;
  status: 'valid' | 'error' | 'duplicate';
  error?: string;
};

type PreviewResult = {
  valid: PreviewItem[];
  invalid: PreviewItem[];
  duplicates: PreviewItem[];
  totalRows: number;
  categoryName: string;
  categoryFee: number;
  detectedColumns: {
    studentID?: string;
    name?: string;
    amount?: string;
  };
};

type Step = 'select' | 'preview' | 'result';

export default function ImportTransactions() {
  const { toast } = useToast();

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORY],
    queryFn: fetchCategories,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [step, setStep] = useState<Step>('select');
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toPreview, setToPreview] = useState<PreviewItem[] | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCategory) {
      toast({
        variant: 'destructive',
        title: 'Please select a category first',
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('excel_file', file);
      formData.append('categoryID', selectedCategory);

      const { data } = await axiosInstance.post<APIResponse<PreviewResult>>(
        '/transaction/import/preview',
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
    if (!selectedFile || !selectedCategory) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('excel_file', selectedFile);
      formData.append('categoryID', selectedCategory);

      const { data } = await axiosInstance.post<APIResponse<ImportResult>>(
        '/transaction/import',
        formData,
      );

      setImportResult(data.data);
      setStep('result');

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTION] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_DATA] });

      if (data.data.failed === 0) {
        toast({
          title: 'Import successful!',
          description: `${data.data.success} transactions imported${data.data.skipped > 0 ? `, ${data.data.skipped} duplicates skipped` : ''}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Import completed with errors',
          description: `${data.data.success} imported, ${data.data.skipped} skipped, ${data.data.failed} failed.`,
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
    setSelectedCategory('');
    setSelectedFile(null);
  };

  useEffect(() => {
    if (previewData) {
      setToPreview([
        ...previewData.valid,
        ...previewData.duplicates,
        ...previewData.invalid,
      ]);
    }
  }, [previewData]);

  return (
    <SidebarPageLayout>
      <BackButton />

      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Import Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Import transactions from an Excel or CSV file.
          </p>
        </div>
      </div>

      <div className="border rounded-xl p-6">
        {step === 'select' && (
          <div className="space-y-6">
            <div className="space-y-2 max-w-md">
              <Label>Select Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={isCategoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name} - {category.organization?.name} (₱
                      {category.fee})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Excel/CSV File</Label>
              <div>
                <Button
                  disabled={isLoading || !selectedCategory}
                  variant="outline"
                  className="w-full max-w-md p-0 h-16 border-dashed"
                  asChild
                >
                  <label
                    className="size-full flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                    htmlFor="transaction-file-input"
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
                  id="transaction-file-input"
                  accept=".xlsx,.xls,.csv"
                  disabled={isLoading || !selectedCategory}
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
                  Extracts ID from emails (e.g., 2501114807@student.buksu.edu.ph)
                </li>
                <li>
                  Amount from: amount, fee, payment columns (or uses category
                  fee)
                </li>
                <li>Date from: date, timestamp columns</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="flex flex-col space-y-6">
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
              {previewData.detectedColumns.amount ? (
                <span>Amount: "{previewData.detectedColumns.amount}"</span>
              ) : (
                <span className="text-muted-foreground">
                  (Using category fee: ₱{previewData.categoryFee})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 border rounded-xl bg-muted/50 col-span-2 md:col-span-1">
                <p className="text-sm text-muted-foreground font-medium">Category</p>
                <p className="font-bold truncate">{previewData.categoryName}</p>
                <p className="text-sm text-muted-foreground">₱{previewData.categoryFee}</p>
              </div>
              <div className="p-4 border rounded-xl bg-green-500/10 border-green-500/20">
                <p className="text-sm text-green-600 font-medium">Valid</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-500">
                  {previewData.valid.length}
                </p>
              </div>
              <div className="p-4 border rounded-xl bg-yellow-500/10 border-yellow-500/20">
                <p className="text-sm text-yellow-600 font-medium">Duplicates</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">
                  {previewData.duplicates.length}
                </p>
              </div>
              <div className="p-4 border rounded-xl bg-red-500/10 border-red-500/20">
                <p className="text-sm text-red-600 font-medium">Invalid</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-500">
                  {previewData.invalid.length}
                </p>
              </div>
              <div className="p-4 border rounded-xl bg-blue-500/10 border-blue-500/20">
                <p className="text-sm text-blue-600 font-medium">Total Rows</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">
                  {previewData.totalRows}
                </p>
              </div>
            </div>

            <div className="max-w-xs">
              <Select
                defaultValue="all"
                onValueChange={(value) => {
                  if (value === 'all') {
                    setToPreview([
                      ...previewData.valid,
                      ...previewData.duplicates,
                      ...previewData.invalid,
                    ]);
                  } else {
                    setToPreview(
                      value === 'valid'
                        ? previewData.valid
                        : value === 'duplicates'
                        ? previewData.duplicates
                        : value === 'invalid'
                        ? previewData.invalid
                        : null,
                    );
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="valid">Valid Only</SelectItem>
                  <SelectItem value="duplicates">Duplicates Only</SelectItem>
                  <SelectItem value="invalid">Invalid Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-md max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name (DB)</TableHead>
                    <TableHead>Name (File)</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toPreview !== null &&
                    toPreview
                      .sort((a, b) => a.rowNum - b.rowNum)
                      .map((item) => (
                        <TableRow key={item.rowNum}>
                          <TableCell className="text-muted-foreground">{item.rowNum}</TableCell>
                          <TableCell className="font-mono text-xs font-medium">
                            {item.studentID || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.studentName || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.nameFromFile || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            ₱{item.amount}
                          </TableCell>
                          <TableCell>
                            {item.status === 'valid' ? (
                              <Badge className="bg-green-600">Valid</Badge>
                            ) : item.status === 'duplicate' ? (
                              <Badge variant="secondary" title={item.error}>
                                {item.error}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" title={item.error}>
                                {item.error}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
                Back to Selection
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={isLoading || previewData.valid.length === 0}
                className="min-w-[200px]"
              >
                {isLoading
                  ? 'Importing...'
                  : `Import ${previewData.valid.length} Transactions`}
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
                Your transactions have been processed.
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
    </SidebarPageLayout>
  );
}
