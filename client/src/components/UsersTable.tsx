import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './ui/table';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import TableLoading from './loading/TableLoading';
import { User } from '@/types/user';
import { format } from 'date-fns';

type UsersTableProps = {
	users?: User[];
	isLoading: boolean;
};
export default function UsersTable({ users, isLoading }: UsersTableProps) {
	const navigate = useNavigate();

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='w-[150px]'>Student ID</TableHead>
					<TableHead className='w-[175px]'>First Name</TableHead>
					<TableHead className='w-[175px]'>Last Name</TableHead>
					{/* RBAC role */}
					<TableHead className='w-[175px]'>Email</TableHead>
					<TableHead className='w-[175px]'>Role</TableHead>
					<TableHead className='w-[150px] text-right'>Joined At</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{isLoading && <TableLoading colSpan={6} />}
				{users &&
					users.map((user) => (
						<TableRow
							className='cursor-pointer'
							onClick={() => navigate(`/user/${user._id}`)}
							key={user._id}
						>
							<TableCell className=''>{user.studentID}</TableCell>
							<TableCell className=''>{_.startCase(user.firstname)}</TableCell>
							<TableCell className=''>{_.startCase(user.lastname)}</TableCell>
							<TableCell className=''>{user.email ?? '--'}</TableCell>
							<TableCell className=''>
								{user.rbacRole?.name ?? user.role ?? '--'}
							</TableCell>
							<TableCell className='text-right'>
								{format(new Date(user.createdAt), 'MM/dd/yyyy')}
							</TableCell>
						</TableRow>
					))}
			</TableBody>

			{/* <TableFooter>
        <TableRow>
          <TableCell colSpan={1}>Total Categories</TableCell>
          <TableCell className='text-right'>{organizations.length}</TableCell>
        </TableRow>
      </TableFooter> */}
		</Table>
	);
}
