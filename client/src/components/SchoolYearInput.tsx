import { useUserStore } from '@/store/user';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getYear } from 'date-fns';
import { User } from '@/types/user';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { APIResponse } from '@/types/api-response';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@/main';
import { useState } from 'react';

export default function SchoolYearInput() {
	const { toast } = useToast();
	const navigate = useNavigate();
	const { user: currentUser, setUser } = useUserStore((state) => state);
	const activeUserYear = currentUser?.activeSchoolYearDB ?? getYear(new Date());
	const [year, setYear] = useState<number>(
		typeof activeUserYear === 'string'
			? parseInt(activeUserYear)
			: activeUserYear,
	);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		try {
			e.preventDefault();
			if (!currentUser) {
				toast({
					variant: 'destructive',
					title: 'No data for current user',
					description: 'Login first to continue',
				});
				navigate('/login');
				return;
			}

			const { data: result } = await axiosInstance.put<APIResponse<User>>(
				`/user/${currentUser._id}`,
				{ ...currentUser, activeSchoolYearDB: year },
			);

			setUser(result.data);
			queryClient.resetQueries();
		} catch (error: any) {
			console.error('Failed to save', error);
			toast({
				title: 'Failed to save',
				description: error.message || 'An error occured while saving',
				variant: 'destructive',
			});
		}
	};

	return (
		<form onSubmit={onSubmit}>
			<div className='flex flex-col gap-2 justify-end'>
				<Label className='ml-1'>School Year:</Label>
				<div className='flex gap-1 items-center w-[150px]'>
					<Input
						value={year ?? 0}
						onChange={(e) => setYear(Number(e.target.value ?? 0))}
						type='number'
					/>
					{currentUser && (
						<p className='w-[150px]'>
							{' '}
							- {Number(currentUser.activeSchoolYearDB) + 1}
						</p>
					)}
				</div>
			</div>
		</form>
	);
}
