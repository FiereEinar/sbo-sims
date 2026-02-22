import { StudentWithTransactions } from '@/types/student';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import {
	User,
	BadgeCheck,
	Wallet,
	BookOpen,
	GraduationCap,
	Users,
	Hash,
} from 'lucide-react';

interface StudentCardProps {
	student: StudentWithTransactions;
}

export default function StudentCard({ student }: StudentCardProps) {
	const navigate = useNavigate();

	const fullName = _.startCase(
		`${student.firstname} ${student.middlename ?? ''} ${
			student.lastname
		}`.toLowerCase(),
	);

	return (
		<div
			onClick={() => navigate(`/student/${student.studentID}`)}
			className='cursor-pointer rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all bg-card/40 border'
		>
			{/* Header */}
			<div className='flex justify-between items-start gap-4'>
				<div className='space-y-1'>
					<div className='flex items-center gap-2'>
						<User size={24} className='text-muted-foreground' />
						<h3 className='font-semibold text-lg leading-none'>{fullName}</h3>
					</div>

					<div className='flex items-center gap-2 text-sm text-muted-foreground'>
						<BadgeCheck size={14} />
						<span>{student.studentID}</span>
					</div>
				</div>

				<div className='text-right'>
					<div className='flex items-center justify-end gap-1 text-sm font-medium'>
						<Wallet size={16} className='text-muted-foreground' />
						<span>₱ {student.totalTransactionsAmount ?? 0}</span>
					</div>
					<p className='text-xs text-muted-foreground shrink-0'>
						{student.totalTransactions ?? 0} transactions
					</p>
				</div>
			</div>

			{/* Details */}
			<div className='mt-5 grid grid-cols-2 gap-3 text-sm'>
				<div className='flex items-center gap-2'>
					<BookOpen size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Course</p>
						<p>{student.course}</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<GraduationCap size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Year</p>
						<p>{student.year}</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<Users size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Gender</p>
						<p>{student.gender}</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<Hash size={18} className='text-muted-foreground' />
					<div>
						<p className='text-muted-foreground text-xs'>Section</p>
						<p>{student.section}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
