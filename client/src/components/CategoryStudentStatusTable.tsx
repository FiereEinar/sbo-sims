import { CategoryStudentStatus } from '@/api/category';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import _ from 'lodash';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import TableLoading from './loading/TableLoading';
import { useQuery } from '@tanstack/react-query';
import { fetchAvailableCourses } from '@/api/student';
import { QUERY_KEYS } from '@/constants';

interface CategoryStudentStatusTableProps {
	students: CategoryStudentStatus[] | undefined;
	isLoading: boolean;
}

function TableHeadCourseFilter() {
	const { setCourse } = useTransactionFilterStore((state) => state);
	const { data: courses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	return (
		<Select
			defaultValue='All'
			onValueChange={(value) => setCourse(value)}
		>
			<SelectTrigger className='w-full border-none pl-0 focus:ring-0 min-w-[90px]'>
				<SelectValue placeholder='Course' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='All'>All Courses</SelectItem>
				{courses &&
					courses.map((course) => (
						<SelectItem key={course} value={course}>
							{course}
						</SelectItem>
					))}
			</SelectContent>
		</Select>
	);
}

function TableHeadStatusFilter() {
	const { setStatus } = useTransactionFilterStore((state) => state);
	return (
		<Select
			defaultValue='all'
			onValueChange={(value) =>
				setStatus(value === 'all' ? undefined : value)
			}
		>
			<SelectTrigger className='w-full border-none pl-0 focus:ring-0 min-w-[90px]'>
				<SelectValue placeholder='Status' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='all'>All Status</SelectItem>
				<SelectItem value='paid'>Paid</SelectItem>
				<SelectItem value='partial'>Partial</SelectItem>
				<SelectItem value='unpaid'>Unpaid</SelectItem>
			</SelectContent>
		</Select>
	);
}

function TableHeadYearFilter() {
	const { setYear } = useTransactionFilterStore((state) => state);
	return (
		<Select
			defaultValue='All'
			onValueChange={(value) =>
				setYear(value === 'All' ? undefined : value)
			}
		>
			<SelectTrigger className='w-full border-none pl-0 focus:ring-0 min-w-[80px]'>
				<SelectValue placeholder='Year' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='All'>All Years</SelectItem>
				<SelectItem value='1'>1st Year</SelectItem>
				<SelectItem value='2'>2nd Year</SelectItem>
				<SelectItem value='3'>3rd Year</SelectItem>
				<SelectItem value='4'>4th Year</SelectItem>
			</SelectContent>
		</Select>
	);
}

function TableHeadSectionFilter() {
	const { section, setSection } = useTransactionFilterStore((state) => state);
	const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

	return (
		<Select
			defaultValue={section ?? 'All'}
			onValueChange={(value) =>
				setSection(value === 'All' ? undefined : value)
			}
		>
			<SelectTrigger className='w-full border-none pl-0 focus:ring-0 min-w-[90px]'>
				<SelectValue placeholder='Section' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='All'>All Sections</SelectItem>
				{sections.map((s) => (
					<SelectItem key={s} value={s}>
						Section {s}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export default function CategoryStudentStatusTable({
	students,
	isLoading,
}: CategoryStudentStatusTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow className='select-none'>
					<TableHead className='w-[110px]'>Student ID</TableHead>
					<TableHead className='w-[200px]'>Name</TableHead>
					<TableHead className='w-[120px]'>
						<TableHeadCourseFilter />
					</TableHead>
					<TableHead className='w-[110px]'>
						<TableHeadYearFilter />
					</TableHead>
					<TableHead className='w-[120px]'>
						<TableHeadSectionFilter />
					</TableHead>
					<TableHead className='w-[110px]'>Amount Paid</TableHead>
					<TableHead className='w-[130px]'>Date Paid</TableHead>
					<TableHead className='w-[120px]'>
						<TableHeadStatusFilter />
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{isLoading && <TableLoading colSpan={8} />}
				{!students?.length && !isLoading && (
					<TableRow>
						<TableCell colSpan={8} className='text-muted-foreground'>
							No students found.
						</TableCell>
					</TableRow>
				)}
				{students?.map((entry) => {
					const { student, amountPaid, status, datePayed } = entry;
					const name = _.startCase(
						`${student.firstname} ${student.lastname}`.toLowerCase()
					);

					const yearLabel = student.year
						? `${student.year}${['st','nd','rd'][student.year - 1] ?? 'th'} Year`
						: '—';

					let statusBadgeVariant: 'default' | 'secondary' | 'destructive' =
						'default';
					if (status === 'unpaid') statusBadgeVariant = 'destructive';
					else if (status === 'partial') statusBadgeVariant = 'secondary';

					return (
						<TableRow key={student._id}>
							<TableCell className='font-medium'>{student.studentID}</TableCell>
							<TableCell>{name}</TableCell>
							<TableCell>{student.course}</TableCell>
							<TableCell>{yearLabel}</TableCell>
							<TableCell>{student.section ?? '—'}</TableCell>
							<TableCell>P{amountPaid}</TableCell>
							<TableCell>
								{datePayed
									? new Date(datePayed).toLocaleDateString()
									: 'N/A'}
							</TableCell>
							<TableCell>
								<Badge variant={statusBadgeVariant} className='uppercase'>
									{status}
								</Badge>
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
