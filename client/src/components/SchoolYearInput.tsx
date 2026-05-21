import { useUserStore } from '@/store/user';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { APIResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@/main';
import { AVAILABLE_SCHOOL_YEARS } from '@/constants';

export default function SchoolYearInput() {
	const { toast } = useToast();
	const navigate = useNavigate();
	const { user: currentUser, setUser } = useUserStore((state) => state);

	const onChange = async (value: string) => {
		if (!currentUser) {
			toast({
				variant: 'destructive',
				title: 'No data for current user',
				description: 'Login first to continue',
			});
			navigate('/login');
			return;
		}

		const previousYear = currentUser.activeSchoolYearDB;

		try {
			// Optimistically update the user store to instantly reflect selection
			const updatedUser = { ...currentUser, activeSchoolYearDB: value };
			setUser(updatedUser);

			// Instantly reset queries to fetch from the new context
			queryClient.resetQueries();

			// Save to backend database asynchronously
			await axiosInstance.put<APIResponse<User>>(
				`/user/${currentUser._id}`,
				updatedUser,
			);
		} catch (error: any) {
			console.error('Failed to save', error);
			// Rollback to previous state on failure
			setUser({ ...currentUser, activeSchoolYearDB: previousYear });
			queryClient.resetQueries();
			toast({
				title: 'Failed to save',
				description: error.message || 'An error occured while saving',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='flex flex-col gap-2 justify-end'>
			<Label className='ml-1'>School Year:</Label>
			<Select
				value={currentUser?.activeSchoolYearDB}
				onValueChange={onChange}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select Year' />
				</SelectTrigger>
				<SelectContent>
					{AVAILABLE_SCHOOL_YEARS.map((year) => (
						<SelectItem key={year} value={year.toString()}>
							{year} - {year + 1}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
