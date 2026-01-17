import axiosInstance from '@/api/axiosInstance';
import { Button } from '../ui/button';
import { useState } from 'react';
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

export default function ImportStudentsButtonSmart() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState<Step>('select');
	const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
				formData
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
				formData
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

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setStep('select');
			setPreviewData(null);
			setImportResult(null);
			setSelectedFile(null);
		}
	};

	const handleBack = () => {
		setStep('select');
		setPreviewData(null);
		setSelectedFile(null);
	};

	const getStatusBadge = (status: string, error?: string) => {
		switch (status) {
			case 'valid':
				return <Badge className='bg-green-600'>New</Badge>;
			case 'exists':
				return <Badge variant='secondary'>Exists</Badge>;
			case 'error':
				return <Badge variant='destructive'>{error}</Badge>;
			default:
				return null;
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant='secondary'>Import</Button>
			</DialogTrigger>
			<DialogContent className='max-w-4xl max-h-[85vh] flex flex-col'>
				<DialogHeader>
					<DialogTitle>
						{step === 'select' && 'Import Students'}
						{step === 'preview' && 'Preview Import'}
						{step === 'result' && 'Import Complete'}
					</DialogTitle>
					<DialogDescription>
						{step === 'select' && 'Import students from Excel or CSV file'}
						{step === 'preview' && 'Review the data before importing'}
						{step === 'result' && 'Import has been completed'}
					</DialogDescription>
				</DialogHeader>

				{/* Step 1: Select File */}
				{step === 'select' && (
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label>Excel/CSV File</Label>
							<div>
								<Button
									disabled={isLoading}
									variant='outline'
									className='w-full p-0'
								>
									<label
										className='size-full px-4 py-2 cursor-pointer flex items-center justify-center'
										htmlFor='student-file-input'
									>
										{isLoading ? 'Loading preview...' : 'Choose File (.xlsx, .csv)'}
									</label>
								</Button>
								<input
									onChange={handleFileSelect}
									hidden
									type='file'
									id='student-file-input'
									accept='.xlsx,.xls,.csv'
									disabled={isLoading}
								/>
							</div>
						</div>

						<div className='text-sm text-muted-foreground space-y-1 border rounded-md p-3 bg-muted/50'>
							<p className='font-medium'>Auto-detected columns:</p>
							<ul className='list-disc list-inside text-xs space-y-1'>
								<li>Student ID from: email, studentID, id columns</li>
								<li>Extracts ID from emails (e.g., 2501114807@student.buksu.edu.ph)</li>
								<li>Name from: name, firstname, lastname columns</li>
								<li>Course, Year, Gender, Section auto-detected</li>
								<li>Existing students will be skipped (not duplicated)</li>
							</ul>
						</div>
					</div>
				)}

				{/* Step 2: Preview */}
				{step === 'preview' && previewData && (
					<div className='flex-1 overflow-hidden flex flex-col'>
						{/* Detected columns */}
						<div className='mb-3 p-2 bg-muted/50 rounded-md text-xs flex flex-wrap gap-2'>
							<span className='font-medium'>Detected: </span>
							{previewData.detectedColumns.studentID && (
								<span>ID: "{previewData.detectedColumns.studentID}"</span>
							)}
							{previewData.detectedColumns.name && (
								<span>Name: "{previewData.detectedColumns.name}"</span>
							)}
							{previewData.detectedColumns.firstname && (
								<span>First: "{previewData.detectedColumns.firstname}"</span>
							)}
							{previewData.detectedColumns.lastname && (
								<span>Last: "{previewData.detectedColumns.lastname}"</span>
							)}
							{previewData.detectedColumns.course && (
								<span>Course: "{previewData.detectedColumns.course}"</span>
							)}
						</div>

						{/* Summary cards */}
						<div className='flex gap-3 mb-4'>
							<div className='flex-1 p-3 border rounded-md bg-green-50 dark:bg-green-950'>
								<p className='text-sm text-muted-foreground'>New Students</p>
								<p className='text-2xl font-bold text-green-600'>{previewData.valid.length}</p>
							</div>
							<div className='flex-1 p-3 border rounded-md bg-yellow-50 dark:bg-yellow-950'>
								<p className='text-sm text-muted-foreground'>Already Exist</p>
								<p className='text-2xl font-bold text-yellow-600'>{previewData.existing.length}</p>
							</div>
							<div className='flex-1 p-3 border rounded-md bg-red-50 dark:bg-red-950'>
								<p className='text-sm text-muted-foreground'>Invalid</p>
								<p className='text-2xl font-bold text-red-600'>{previewData.invalid.length}</p>
							</div>
							<div className='flex-1 p-3 border rounded-md bg-blue-50 dark:bg-blue-950'>
								<p className='text-sm text-muted-foreground'>Total Rows</p>
								<p className='text-2xl font-bold text-blue-600'>{previewData.totalRows}</p>
							</div>
						</div>

						{/* Table */}
						<div className='flex-1 overflow-auto border rounded-md max-h-64'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-12'>Row</TableHead>
										<TableHead>Student ID</TableHead>
										<TableHead>Name</TableHead>
										<TableHead>Course</TableHead>
										<TableHead>Year</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{[...previewData.valid, ...previewData.existing, ...previewData.invalid]
										.sort((a, b) => a.rowNum - b.rowNum)
										.map((item) => (
											<TableRow key={item.rowNum}>
												<TableCell>{item.rowNum}</TableCell>
												<TableCell className='font-mono text-xs'>{item.studentID || '-'}</TableCell>
												<TableCell className='text-sm'>
													{item.firstname} {item.middlename} {item.lastname}
												</TableCell>
												<TableCell>{item.course || '-'}</TableCell>
												<TableCell>{item.year}</TableCell>
												<TableCell>{getStatusBadge(item.status, item.error)}</TableCell>
											</TableRow>
										))}
								</TableBody>
							</Table>
						</div>

						<DialogFooter className='mt-4'>
							<Button variant='outline' onClick={handleBack} disabled={isLoading}>
								Back
							</Button>
							<Button
								onClick={handleConfirmImport}
								disabled={isLoading || previewData.valid.length === 0}
							>
								{isLoading ? 'Importing...' : `Import ${previewData.valid.length} New Students`}
							</Button>
						</DialogFooter>
					</div>
				)}

				{/* Step 3: Result */}
				{step === 'result' && importResult && (
					<div className='space-y-4 py-4'>
						<div className='flex gap-4'>
							<div className='flex-1 p-4 border rounded-md bg-green-50 dark:bg-green-950 text-center'>
								<p className='text-3xl font-bold text-green-600'>{importResult.success}</p>
								<p className='text-sm text-muted-foreground'>Added</p>
							</div>
							<div className='flex-1 p-4 border rounded-md bg-yellow-50 dark:bg-yellow-950 text-center'>
								<p className='text-3xl font-bold text-yellow-600'>{importResult.skipped}</p>
								<p className='text-sm text-muted-foreground'>Skipped</p>
							</div>
							<div className='flex-1 p-4 border rounded-md bg-red-50 dark:bg-red-950 text-center'>
								<p className='text-3xl font-bold text-red-600'>{importResult.failed}</p>
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
