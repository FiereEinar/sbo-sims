import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { useUserStore } from '@/store/user';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axiosInstance from '@/api/axiosInstance';
import { APIResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { queryClient } from '@/main';

export default function SemInput() {
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

		const previousSem = currentUser.activeSemDB;

		try {
			// Optimistically update the user store to instantly reflect selection
			const updatedUser = { ...currentUser, activeSemDB: value as '1' | '2' };
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
			setUser({ ...currentUser, activeSemDB: previousSem });
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
			<Label className='ml-1'>Semester:</Label>
			<Select
				value={currentUser?.activeSemDB ?? '1'}
				onValueChange={onChange}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Semester' />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='1'>1st sem</SelectItem>
					<SelectItem value='2'>2nd sem</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}
