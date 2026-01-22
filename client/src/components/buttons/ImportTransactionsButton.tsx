import axiosInstance from '@/api/axiosInstance';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { APIResponse } from '@/types/api-response';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Category } from '@/types/category';
import { Label } from '../ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

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

type ImportTransactionsButtonProps = {
	categories: Category[] | undefined;
};

type Step = 'select' | 'preview' | 'result';

export default function ImportTransactionsButton({
	categories,
}: ImportTransactionsButtonProps) {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
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
		} catch (err: unknown) {
			const error = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			console.error('Failed to preview file', err);
			toast({
				variant: 'destructive',
				title: 'Failed to preview file',
				description:
					error.response?.data?.message || error.message || 'An error occurred',
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
		} catch (err: unknown) {
			const error = err as {
				response?: { data?: { message?: string } };
				message?: string;
			};
			console.error('Failed to import file', err);
			toast({
				variant: 'destructive',
				title: 'Failed to import file',
				description:
					error.response?.data?.message || error.message || 'An error occurred',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			// Reset state when closing
			setStep('select');
			setPreviewData(null);
			setImportResult(null);
			setSelectedCategory('');
			setSelectedFile(null);
		}
	};

	const handleBack = () => {
		setStep('select');
		setPreviewData(null);
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
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant='secondary'>Import</Button>
			</DialogTrigger>
			<DialogContent className='max-w-2xl max-h-[85vh] flex flex-col'>
				<DialogHeader>
					<DialogTitle>
						{step === 'select' && 'Import Transactions'}
						{step === 'preview' && 'Preview Import'}
						{step === 'result' && 'Import Complete'}
					</DialogTitle>
					<DialogDescription>
						{step === 'select' &&
							'Import transactions from an Excel or CSV file'}
						{step === 'preview' && 'Review the data before importing'}
						{step === 'result' && 'Import has been completed'}
					</DialogDescription>
				</DialogHeader>

				{/* Step 1: Select Category and File */}
				{step === 'select' && (
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label>Select Category</Label>
							<Select
								value={selectedCategory}
								onValueChange={setSelectedCategory}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select a category' />
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

						<div className='space-y-2'>
							<Label>Excel/CSV File</Label>
							<div>
								<Button
									disabled={isLoading || !selectedCategory}
									variant='outline'
									className='w-full p-0'
								>
									<label
										className='size-full px-4 py-2 cursor-pointer flex items-center justify-center'
										htmlFor='excel-input'
									>
										{isLoading
											? 'Loading preview...'
											: 'Choose File (.xlsx, .csv)'}
									</label>
								</Button>
								<input
									onChange={handleFileSelect}
									hidden
									type='file'
									id='excel-input'
									accept='.xlsx,.xls,.csv'
									disabled={isLoading || !selectedCategory}
								/>
							</div>
						</div>

						<div className='text-sm text-muted-foreground space-y-1 border rounded-md p-3 bg-muted/50'>
							<p className='font-medium'>Auto-detected columns:</p>
							<ul className='list-disc list-inside text-xs space-y-1'>
								<li>Student ID from: email, studentID, id columns</li>
								<li>
									Extracts ID from emails (e.g.,
									2501114807@student.buksu.edu.ph)
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

				{/* Step 2: Preview */}
				{step === 'preview' && previewData && (
					<div className='flex-1 overflow-hidden flex flex-col'>
						{/* Detected columns info */}
						<div className='mb-3 p-2 bg-muted/50 rounded-md text-xs'>
							<span className='font-medium'>Detected columns: </span>
							{previewData.detectedColumns.studentID && (
								<span className='mr-2'>
									ID: "{previewData.detectedColumns.studentID}"
								</span>
							)}
							{previewData.detectedColumns.name && (
								<span className='mr-2'>
									Name: "{previewData.detectedColumns.name}"
								</span>
							)}
							{previewData.detectedColumns.amount && (
								<span>Amount: "{previewData.detectedColumns.amount}"</span>
							)}
							{!previewData.detectedColumns.amount && (
								<span className='text-muted-foreground'>
									(Using category fee: ₱{previewData.categoryFee})
								</span>
							)}
						</div>

						<div className='flex gap-4 mb-4'>
							<div className='flex-1 p-3 border rounded-md bg-muted/50'>
								<p className='text-sm text-muted-foreground'>Category</p>
								<p className='font-medium'>{previewData.categoryName}</p>
								<p className='text-sm'>Fee: ₱{previewData.categoryFee}</p>
							</div>
							<div className='flex-1 p-3 border rounded-md bg-green-50 dark:bg-green-950'>
								<p className='text-sm text-muted-foreground'>Valid</p>
								<p className='text-2xl font-bold text-green-600'>
									{previewData.valid.length}
								</p>
							</div>
							<div className='flex-1 p-3 border rounded-md bg-yellow-50 dark:bg-yellow-950'>
								<p className='text-sm text-muted-foreground'>Duplicates</p>
								<p className='text-2xl font-bold text-yellow-600'>
									{previewData.duplicates.length}
								</p>
							</div>
							<div className='flex-1 p-3 border rounded-md bg-red-50 dark:bg-red-950'>
								<p className='text-sm text-muted-foreground'>Invalid</p>
								<p className='text-2xl font-bold text-red-600'>
									{previewData.invalid.length}
								</p>
							</div>
						</div>

						{/* valid, duplicate, or invalid selector */}
						<Select
							defaultValue='all'
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
							<SelectTrigger className='w-full mb-1'>
								<SelectValue placeholder='Select items' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All</SelectItem>
								<SelectItem value='valid'>Valid</SelectItem>
								<SelectItem value='duplicates'>Duplicates</SelectItem>
								<SelectItem value='invalid'>Invalid</SelectItem>
							</SelectContent>
						</Select>

						<div className='flex-1 overflow-auto border rounded-md max-h-64'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-12'>Row</TableHead>
										<TableHead>Student ID</TableHead>
										<TableHead>Name (DB)</TableHead>
										<TableHead>Name (File)</TableHead>
										<TableHead className='text-right'>Amount</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{toPreview !== null &&
										toPreview
											.sort((a, b) => a.rowNum - b.rowNum)
											.map((item) => (
												<TableRow key={item.rowNum}>
													<TableCell>{item.rowNum}</TableCell>
													<TableCell className='font-mono text-xs'>
														{item.studentID || '-'}
													</TableCell>
													<TableCell className='text-sm'>
														{item.studentName || '-'}
													</TableCell>
													<TableCell className='text-sm text-muted-foreground'>
														{item.nameFromFile || '-'}
													</TableCell>
													<TableCell className='text-right'>
														₱{item.amount}
													</TableCell>
													<TableCell>
														{item.status === 'valid' ? (
															<Badge variant='default' className='bg-green-600'>
																Valid
															</Badge>
														) : item.status === 'duplicate' ? (
															<Badge variant='secondary' title={item.error}>
																{item.error}
															</Badge>
														) : (
															<Badge variant='destructive' title={item.error}>
																{item.error}
															</Badge>
														)}
													</TableCell>
												</TableRow>
											))}
								</TableBody>
							</Table>
						</div>

						<DialogFooter className='mt-4'>
							<Button
								variant='outline'
								onClick={handleBack}
								disabled={isLoading}
							>
								Back
							</Button>
							<Button
								onClick={handleConfirmImport}
								disabled={isLoading || previewData.valid.length === 0}
							>
								{isLoading
									? 'Importing...'
									: `Import ${previewData.valid.length} Transactions`}
							</Button>
						</DialogFooter>
					</div>
				)}

				{/* Step 3: Result */}
				{step === 'result' && importResult && (
					<div className='space-y-4 py-4'>
						<div className='flex gap-4'>
							<div className='flex-1 p-4 border rounded-md bg-green-50 dark:bg-green-950 text-center'>
								<p className='text-3xl font-bold text-green-600'>
									{importResult.success}
								</p>
								<p className='text-sm text-muted-foreground'>Imported</p>
							</div>
							<div className='flex-1 p-4 border rounded-md bg-yellow-50 dark:bg-yellow-950 text-center'>
								<p className='text-3xl font-bold text-yellow-600'>
									{importResult.skipped}
								</p>
								<p className='text-sm text-muted-foreground'>Skipped</p>
							</div>
							<div className='flex-1 p-4 border rounded-md bg-red-50 dark:bg-red-950 text-center'>
								<p className='text-3xl font-bold text-red-600'>
									{importResult.failed}
								</p>
								<p className='text-sm text-muted-foreground'>Failed</p>
							</div>
						</div>

						{importResult.errors.length > 0 && (
							<div className='border rounded-md p-3'>
								<p className='font-medium text-red-600 mb-2'>Errors:</p>
								<div className='max-h-40 overflow-auto'>
									<ul className='text-sm text-red-500 space-y-1'>
										{importResult.errors.map((error, index) => (
											<li key={index}>• {error}</li>
										))}
									</ul>
								</div>
							</div>
						)}

						<DialogFooter>
							<Button onClick={() => handleOpenChange(false)}>Done</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
