import {
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
	Table,
} from './ui/table';
import { StudentWithTransactions } from '@/types/student';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface StudentsTableProps {
	students: StudentWithTransactions[];
}

export default function StudentsTable({ students }: StudentsTableProps) {
	const [totalAmount, setTotalAmount] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		if (students) {
			setTotalAmount(
				students.reduce((prevAmount, curr) => {
					return prevAmount + curr.totalTransactionsAmount || 0;
				}, 0)
			);
		}
	}, [students]);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className=''>Student ID</TableHead>
					<TableHead>Full name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead className=''>Transactions made</TableHead>
					<TableHead className='text-right '>Transactions amount</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{students.map((student) => (
					<TableRow
						className='cursor-pointer'
						onClick={() => navigate(`/student/${student.studentID}`)}
						key={student._id}
					>
						<TableCell className='text-muted-foreground'>
							{student.studentID}
						</TableCell>
						<TableCell className='text-muted-foreground'>{`${student.firstname} ${student.lastname}`}</TableCell>
						<TableCell className='text-muted-foreground'>
							{student.email}
						</TableCell>
						<TableCell className='text-muted-foreground'>
							{student.totalTransactions}
						</TableCell>
						<TableCell className='text-right'>
							{student.totalTransactionsAmount ?? 0}
						</TableCell>
					</TableRow>
				))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={4}>Total</TableCell>
					<TableCell className='text-right'>{totalAmount}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
