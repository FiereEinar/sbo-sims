import { Student } from '@/types/student';
import _ from 'lodash';
import { GraduationCap, Hash, Mail, User } from 'lucide-react';

interface StudentDataCardProps {
	studentID: string;
	student: Student;
}

export default function StudentDataCard({
	studentID,
	student,
}: StudentDataCardProps) {
	const fullName = _.startCase(
		`${student.firstname} ${student.middlename ?? ''} ${
			student.lastname
		}`.toLowerCase()
	);

	return (
		<div className='rounded-2xl border bg-card/50 p-6 shadow-sm'>
			<div className='flex items-start gap-6'>
				<div className='h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold'>
					{student.firstname[0]}
				</div>

				<div className='flex-1'>
					<h2 className='text-xl font-semibold'>{fullName}</h2>
					<p className='text-sm text-muted-foreground'>Student Profile</p>

					<div className='mt-4 grid gap-3 sm:grid-cols-2'>
						<InfoRow
							icon={<Hash size={25} />}
							label='Student ID'
							value={studentID}
						/>
						<InfoRow
							icon={<Mail size={25} />}
							label='Email'
							value={student.email || 'Not provided'}
						/>
						<InfoRow
							icon={<User size={25} />}
							label='Gender'
							value={student.gender}
						/>
						<InfoRow
							icon={<GraduationCap size={25} />}
							label='Year Level'
							value={String(student.year)}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

interface InfoRowProps {
	icon: JSX.Element;
	label: string;
	value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
	return (
		<div className='flex items-center gap-3'>
			<div className='text-muted-foreground'>{icon}</div>
			<div>
				<p className='text-xs text-muted-foreground'>{label}</p>
				<p className='font-medium'>{value}</p>
			</div>
		</div>
	);
}
