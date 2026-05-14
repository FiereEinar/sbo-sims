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

interface CategoryStudentStatusTableProps {
	students: CategoryStudentStatus[] | undefined;
	isLoading: boolean;
}

export default function CategoryStudentStatusTable({
	students,
	isLoading,
}: CategoryStudentStatusTableProps) {
	if (isLoading) {
		return <p className='text-muted-foreground'>Loading student status...</p>;
	}

	if (!students || students.length === 0) {
		return <p className='text-muted-foreground'>No students found.</p>;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
						<TableHead>Student ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Course</TableHead>
						<TableHead>Amount Paid</TableHead>
						<TableHead>Date Payed</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{students.map((entry) => {
						const { student, amountPaid, status, datePayed } = entry;
						const name = _.startCase(
							`${student.firstname} ${student.lastname}`.toLowerCase()
						);

						let statusBadgeVariant: 'default' | 'secondary' | 'destructive' = 'default';
						if (status === 'unpaid') statusBadgeVariant = 'destructive';
						else if (status === 'partial') statusBadgeVariant = 'secondary';

						return (
							<TableRow key={student._id}>
								<TableCell className='font-medium'>
									{student.studentID}
								</TableCell>
								<TableCell>{name}</TableCell>
								<TableCell>{student.course}</TableCell>
								<TableCell>P{amountPaid}</TableCell>
								<TableCell>
									{datePayed ? new Date(datePayed).toLocaleDateString() : 'N/A'}
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
