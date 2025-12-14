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
		<section className='bg-card/40 border rounded-lg p-4 space-y-4'>
			<div>
				<Header size='sm'>Application Settings</Header>
				<p className='text-sm text-muted-foreground'>
					Configure the active school year and semester for the system.
				</p>
			</div>

			<div className='grid gap-4 sm:grid-cols-2'>
				<div className='space-y-1'>
					<Label>School Year</Label>
					<Input
						type='number'
						value={parseInt(
							localUser?.activeSchoolYearDB || getYear(new Date()).toString()
						)}
						onChange={(e) =>
							setLocalUser({
								...localUser,
								activeSchoolYearDB: e.target.value,
							} as User)
						}
					/>
				</div>

				<div className='space-y-1'>
					<Label>Semester</Label>
					<Select
						value={localUser?.activeSemDB ?? '1'}
						onValueChange={(value) =>
							setLocalUser({ ...localUser, activeSemDB: value } as User)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder='Select semester' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='1'>1st Semester</SelectItem>
							<SelectItem value='2'>2nd Semester</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className='flex justify-end pt-2'>
				<Button size='sm' onClick={onSave}>
					Save Application Settings
				</Button>
			</div>
		</section>
	);
}
