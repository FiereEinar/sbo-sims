import axiosInstance from '@/api/axiosInstance';
import { getCategoryStudentStatusDownloadURL } from '@/api/category';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useState } from 'react';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Download, ChevronDown } from 'lucide-react';

type FileType = 'pdf' | 'csv';

type DownloadCategoryStudentStatusButtonProps = {
	categoryID: string;
};

export default function DownloadCategoryStudentStatusButton({
	categoryID,
}: DownloadCategoryStudentStatusButtonProps) {
	const { getFilterValues } = useTransactionFilterStore((state) => state);
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownload = async (fileType: FileType) => {
		try {
			setIsDownloading(true);

			const filters = { ...getFilterValues() };
			const url = getCategoryStudentStatusDownloadURL(categoryID, fileType, filters);

			const result = await axiosInstance.get(url, {
				responseType: 'blob',
			});

			const blob = new Blob([result.data], {
				type: fileType === 'pdf' ? 'application/pdf' : 'text/csv',
			});
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'student-status.' + fileType;
			link.click();
			URL.revokeObjectURL(link.href);
		} catch (err: any) {
			console.error('Error downloading the file: ', err);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button disabled={isDownloading} variant='secondary' className='flex items-center gap-2'>
					<Download className="w-4 h-4" />
					<span>Download</span>
					<ChevronDown className="w-4 h-4 ml-1" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{import.meta.env.VITE_NODE_ENV !== 'production' && (
					<DropdownMenuItem onClick={() => handleDownload('pdf')} className='cursor-pointer'>
						Download PDF
					</DropdownMenuItem>
				)}
				<DropdownMenuItem onClick={() => handleDownload('csv')} className='cursor-pointer'>
					Download CSV
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
