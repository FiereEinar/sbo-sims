import { OrganizationWithCategory } from '@/types/organization';
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

type OrganizationTableProps = {
	organizations?: OrganizationWithCategory[];
	isLoading: boolean;
};
export default function OrganizationTable({
	organizations,
	isLoading,
}: OrganizationTableProps) {
	const navigate = useNavigate();

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='w-[150px]'>Organization</TableHead>
					<TableHead className='w-[175px]'>Governor</TableHead>
					<TableHead className='w-[175px]'>Vice Governor</TableHead>
					<TableHead className='w-[175px]'>Treasurer</TableHead>
					<TableHead className='w-[175px]'>Auditor</TableHead>
					<TableHead className='w-[150px] text-right'>
						Total Categories
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{isLoading && <TableLoading colSpan={6} />}
				{organizations &&
					organizations.map((org) => (
						<TableRow
							className='cursor-pointer'
							onClick={() => navigate(`/organization/${org._id}`)}
							key={org._id}
						>
							<TableCell className=''>{org.name}</TableCell>
							<TableCell className=''>{_.startCase(org.governor)}</TableCell>
							<TableCell className=''>
								{_.startCase(org.viceGovernor)}
							</TableCell>
							<TableCell className=''>{_.startCase(org.treasurer)}</TableCell>
							<TableCell className=''>{_.startCase(org.auditor)}</TableCell>
							<TableCell className='text-right'>
								{org.categories?.length ?? 0}
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
