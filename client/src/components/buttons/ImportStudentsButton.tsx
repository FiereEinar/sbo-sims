import axiosInstance from '@/api/axiosInstance';
import { Button } from '../ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { APIResponse } from '@/types/api-response';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';

export default function ImportStudentsButton() {
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const onSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			setIsLoading(true);

			let file: File | null = null;

			if (e.target.files) {
				file = e.target.files[0];
			}

			const formData = new FormData();
			if (file) formData.append('csv_file', file);

			await axiosInstance.post<APIResponse<null>>('/student/import', formData);

			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.STUDENT] });
			toast({
				title: 'File imported successfully!',
			});
		} catch (err: any) {
			console.error('Failed to import file', err);
			toast({
				variant: 'destructive',
				title: 'Failed to import file',
				description: err.message || 'An error occured while importing file',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<Button disabled={isLoading} variant='secondary' className='p-0'>
				<label
					className='size-full px-4 py-2 cursor-pointer'
					htmlFor='csv-input'
				>
					Import
				</label>
			</Button>
			<input
				onChange={onSubmit}
				hidden
				type='file'
				id='csv-input'
				accept='.csv'
			/>
		</div>
	);
}
