import { fetchRoleByID } from '@/api/role';
import BackButton from '@/components/buttons/BackButton';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import StudentDataCardLoading from '@/components/loading/StudentDataCardLoading';
import { RolePermissionsEditor } from '@/components/RolePermissionsEditor';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function RoleInfo() {
	const { roleID } = useParams();
	if (roleID === undefined) return;

	const {
		data: role,
		isLoading: isloading,
		error: error,
	} = useQuery({
		queryKey: [QUERY_KEYS.ROLES, { roleID }],
		queryFn: () => fetchRoleByID(roleID),
	});

	if (error) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />

			{isloading && <StickyHeaderLoading />}

			<Header>Role Information</Header>

			{isloading && <StudentDataCardLoading />}

			{role && (
				<div className='space-y-6'>
					{/* // Role Header Card */}
					<div className='rounded-2xl border bg-card/50 p-6 shadow-sm'>
						<div>
							<h2 className='text-xl font-semibold'>{role.name}</h2>
							<p className='text-sm text-muted-foreground'>
								{role.description}
							</p>
						</div>
					</div>

					{/* // Permissions Editor */}
					<RolePermissionsEditor role={role} />
				</div>
			)}
		</SidebarPageLayout>
	);
}
