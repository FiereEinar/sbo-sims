import { fetchUserByID } from '@/api/user';
import BackButton from '@/components/buttons/BackButton';
import { AddUserForm } from '@/components/forms/AddUserForm';
import HasPermission from '@/components/HasPermission';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import StudentDataCardLoading from '@/components/loading/StudentDataCardLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentDataCard from '@/components/StudentDataCard';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function UserInfo() {
	const { userID } = useParams();
	if (userID === undefined) return;

	const {
		data: user,
		isLoading: isloading,
		error: error,
	} = useQuery({
		queryKey: [QUERY_KEYS.USERS, { userID }],
		queryFn: () => fetchUserByID(userID),
	});

	if (error) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />

			{isloading && <StickyHeaderLoading />}

			{user && (
				<StickyHeader>
					<Header>User Information</Header>

					<HasPermission permissions={[MODULES.USER_UPDATE]}>
						<AddUserForm mode='edit' user={user} />
					</HasPermission>
				</StickyHeader>
			)}

			<div className='space-y-6'>
				{isloading && <StudentDataCardLoading />}

				{user && (
					<StudentDataCard
						student={{
							__v: 0,
							_id: user._id,
							firstname: user.firstname,
							middlename: '',
							lastname: user.lastname,
							email: user.email,
							studentID: user.studentID,
							year: 0,
							course: '',
							gender: '',
							updatedAt: user.updatedAt,
							createdAt: user.createdAt,
						}}
					/>
				)}
			</div>
		</SidebarPageLayout>
	);
}
