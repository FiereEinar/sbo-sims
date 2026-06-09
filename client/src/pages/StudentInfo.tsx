import { fetchStudentByID, fetchStudentTransactions } from '@/api/student';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteStudentButton from '@/components/buttons/EditAndDeleteStudentButton';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import StudentDataCardLoading from '@/components/loading/StudentDataCardLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentDataCard from '@/components/StudentDataCard';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { 
	Dialog, 
	DialogContent, 
	DialogHeader, 
	DialogTitle,
	DialogTrigger 
} from '@/components/ui/dialog';
import TransactionReceipt from '@/components/TransactionReceipt';
import { Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';

export default function StudentInfo() {
	const { studentID } = useParams();
	const { toast } = useToast();
	
	const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
	const [isDownloading, setIsDownloading] = useState(false);

	if (studentID === undefined) return;

	const {
		data: student,
		isLoading: studentLoading,
		error: studentError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, { studentID }],
		queryFn: () => fetchStudentByID(studentID),
	});

	const {
		data: transactions,
		isLoading: txLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_TRANSACTIONS, { studentID }],
		queryFn: () => fetchStudentTransactions(studentID),
	});

	const selectedTransactions = useMemo(() => {
		if (!transactions) return [];
		return transactions.filter(tx => selectedTxIds.includes(tx._id));
	}, [transactions, selectedTxIds]);

	const handleDownloadPDF = async () => {
		const imgElement = document.getElementById('secure-receipt-image') as HTMLImageElement;
		
		if (imgElement && imgElement.src) {
			try {
				setIsDownloading(true);
				
				// Create PDF based on natural image dimensions (high res)
				// We'll scale it down to typical A4 or let jsPDF handle pixel sizes
				const imgWidth = imgElement.naturalWidth || 1536; // 768 * 2
				const imgHeight = imgElement.naturalHeight || 2048;

				const pdf = new jsPDF({
					orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
					unit: 'px',
					format: [imgWidth, imgHeight]
				});

				pdf.addImage(imgElement.src, 'PNG', 0, 0, imgWidth, imgHeight);
				pdf.save(`consolidated-receipt-${student?.studentID || 'student'}.pdf`);
			} catch (error) {
				console.error('Error generating PDF', error);
				toast({ variant: 'destructive', title: 'Failed to generate PDF' });
			} finally {
				setIsDownloading(false);
			}
			return;
		}

		// Fallback if the image hasn't loaded yet
		const element = document.getElementById('transaction-receipt-document');
		if (!element) {
			toast({ variant: 'destructive', title: 'Receipt element not found or still generating...' });
			return;
		}

		try {
			setIsDownloading(true);
			
			const originalBackground = element.style.backgroundColor;
			element.style.backgroundColor = 'white';

			const canvas = await html2canvas(element, {
				scale: 2, 
				useCORS: true,
			});

			element.style.backgroundColor = originalBackground;

			const imgData = canvas.toDataURL('image/png');
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'px',
				format: [canvas.width, canvas.height]
			});

			pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
			pdf.save(`consolidated-receipt-${student?.studentID || 'student'}.pdf`);
		} catch (error) {
			console.error('Error generating PDF', error);
			toast({ variant: 'destructive', title: 'Failed to generate PDF' });
		} finally {
			setIsDownloading(false);
		}
	};

	if (studentError || transactionsError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />

			{studentLoading && <StickyHeaderLoading />}

			{student && (
				<StickyHeader>
					<Header>Student Information</Header>
					<div className="flex items-center gap-4">
						{selectedTxIds.length > 0 && (
							<Dialog>
								<DialogTrigger asChild>
									<Button variant="default" className="flex gap-2">
										<FileText size={16} />
										Generate Receipt ({selectedTxIds.length})
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
									<DialogHeader>
										<DialogTitle className="flex justify-between items-center pr-8">
											<span>Consolidated Receipt</span>
											<Button
												variant="outline"
												size="sm"
												onClick={handleDownloadPDF}
												disabled={isDownloading}
												className="flex gap-2"
											>
												<Download size={16} />
												{isDownloading ? 'Generating...' : 'Download PDF'}
											</Button>
										</DialogTitle>
									</DialogHeader>
									<div className="mt-4">
										<TransactionReceipt transactions={selectedTransactions} />
									</div>
								</DialogContent>
							</Dialog>
						)}
						<EditAndDeleteStudentButton student={student} />
					</div>
				</StickyHeader>
			)}

			<div className='space-y-6'>
				{studentLoading && <StudentDataCardLoading />}

				{student && <StudentDataCard student={student} />}

				<div className='rounded-2xl border bg-card/50 p-6 shadow-sm'>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='font-semibold'>Transaction History</h2>
						{selectedTxIds.length > 0 && (
							<span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
								{selectedTxIds.length} selected
							</span>
						)}
					</div>
					<TransactionsTable
						isLoading={txLoading}
						transactions={transactions}
						selectable={true}
						selectedIds={selectedTxIds}
						onSelectionChange={setSelectedTxIds}
					/>
				</div>
			</div>
		</SidebarPageLayout>
	);
}
