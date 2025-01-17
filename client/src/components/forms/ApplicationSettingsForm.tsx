import { useUserStore } from '@/store/user';
import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { User } from '@/types/user';
import { Input } from '../ui/input';
import { getYear } from 'date-fns';
import Header from '../ui/header';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { queryClient } from '@/main';
import { useState } from 'react';
import { Button } from '../ui/button';
import { APIResponse } from '@/types/api-response';

export default function ApplicationSettingsForm() {
	const { toast } = useToast();
	const navigate = useNavigate();

	const { user: currentUser, setUser } = useUserStore((state) => state);
	const [localUser, setLocalUser] = useState(currentUser);

	const onSave = async () => {
		try {
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
				localUser
			);

			setUser(result.data);
			toast({ title: 'Settings saved successfully!' });
			queryClient.resetQueries();
		} catch (err: any) {
			console.error('Failed to save settings', err);
			toast({
				title: 'Failed to save settings',
				description: err.message || 'An error occured while saving settings',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='flex flex-col gap-3 w-full bg-card/40 p-3 rounded-md border'>
			<Header>Application</Header>
			<p>
				Update the applications configurations on this section. Click save
				changes when your're done editing!
			</p>
			<div className='w-[20rem] space-y-2'>
				<div className='space-x-1'>
					<Label className='ml-1'>School Year:</Label>
					<Input
						value={parseInt(
							localUser?.activeSchoolYearDB || getYear(new Date()).toString()
						)}
						onChange={(e) =>
							setLocalUser({
								...localUser,
								activeSchoolYearDB: e.target.value,
							} as User)
						}
						type='number'
					/>
				</div>

				<div className='space-x-1'>
					<Label className='ml-1'>Semester:</Label>
					<Select
						defaultValue={localUser?.activeSemDB ?? '1'}
						onValueChange={(value) =>
							setLocalUser({ ...localUser, activeSemDB: value } as User)
						}
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
			</div>

			<div className='flex justify-end'>
				<Button onClick={onSave} size='sm'>
					Save Changes
				</Button>
			</div>
		</div>
	);
}
