import { Organization } from '@/types/organization';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './ui/table';
import { useNavigate } from 'react-router-dom';

type OrganizationTableProps = {
	organizations: Organization[];
};
export default function OrganizationTable({
	organizations,
}: OrganizationTableProps) {
	const navigate = useNavigate();

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='w-[400px]'>Organization</TableHead>
					<TableHead className='w-[400px] text-right'>
						Total Categories
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{organizations.map((org) => (
					<TableRow
						className='cursor-pointer'
						onClick={() => navigate(`/organization/${org._id}`)}
						key={org._id}
					>
						<TableCell className=''>{org.name}</TableCell>
						<TableCell className='text-right'>
							{org.categories.length}
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
