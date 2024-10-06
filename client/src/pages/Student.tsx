import { fetchStudents } from '@/api/student';
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Student() {
	const [totalAmount, setTotalAmount] = useState(0);
	const navigate = useNavigate();

	const {
		data: students,
		isLoading: studentsLoading,
		error: studentsError,
	} = useQuery({
		queryKey: ['students'],
		queryFn: fetchStudents,
	});

	useEffect(() => {
		if (students) {
			setTotalAmount(
				students.reduce((prevAmount, curr) => {
					return prevAmount + curr.totalTransactionsAmount;
				}, 0)
			);
		}
	}, [students]);

	if (studentsLoading) {
		return <p>Loading...</p>;
	}

	if (studentsError || students === undefined) {
		return <p>Error</p>;
	}

	return (
		<section>
			<h1 className='mb-3 text-lg'>Student List</h1>
			<Table>
				{/* <TableCaption>A list of your recent invoices.</TableCaption> */}
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
								{student.totalTransactionsAmount}
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
		</section>
	);
}
