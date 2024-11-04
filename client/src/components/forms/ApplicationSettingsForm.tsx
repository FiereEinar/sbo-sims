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
import SaveSettingsButton from '../buttons/SaveSettingsButton';

export default function ApplicationSettingsForm() {
	const { user, setUser } = useUserStore((state) => state);

	return (
		<div className='flex flex-col gap-3 w-full'>
			<Header>Application Settings</Header>
			<p>
				Update the applications configurations on this section. Click save
				changes when your're done editing!
			</p>
			<div className='space-x-1'>
				<Label className='ml-1'>School Year:</Label>
				<Input
					value={parseInt(
						user?.activeSchoolYearDB || getYear(new Date()).toString()
					)}
					onChange={(e) =>
						setUser({ ...user, activeSchoolYearDB: e.target.value } as User)
					}
					type='number'
				/>
			</div>

			<div className='space-x-1'>
				<Label className='ml-1'>Semester:</Label>
				<Select
					defaultValue={user?.activeSemDB ?? '1'}
					onValueChange={(value) =>
						setUser({ ...user, activeSemDB: value } as User)
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

			<div className='flex justify-end'>
				<SaveSettingsButton />
			</div>
		</div>
	);
}
