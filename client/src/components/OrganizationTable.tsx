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
import _ from 'lodash';

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
					<TableHead className='w-[200px]'>Organization</TableHead>
					<TableHead className='w-[200px]'>Governor</TableHead>
					<TableHead className='w-[200px]'>Treasurer</TableHead>
					<TableHead className='w-[200px] text-right'>
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
						<TableCell className=''>{_.startCase(org.governor)}</TableCell>
						<TableCell className=''>{_.startCase(org.treasurer)}</TableCell>
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
