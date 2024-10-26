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

export default function SettingsForm() {
	const { user, setUser } = useUserStore((state) => state);

	return (
		<div>
			<div className='space-x-1 mb-3'>
				<Label className='ml-1'>School Year:</Label>
				<Input
					value={parseInt(
						user?.activeSchoolYearDB ?? getYear(new Date()).toString()
					)}
					onChange={(e) =>
						setUser({ ...user, activeSchoolYearDB: e.target.value } as User)
					}
					type='number'
				/>
			</div>

			<div className='space-x-1 mb-3'>
				<Label className='ml-1'>Semester:</Label>
				<Select
					defaultValue={user?.activeSemDB ?? '1'}
					onValueChange={(value) =>
						setUser({ ...user, activeSemDB: value } as User)
					}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Course' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='1'>1st sem</SelectItem>
						<SelectItem value='2'>2nd sem</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
