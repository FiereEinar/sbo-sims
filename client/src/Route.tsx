import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Student from './pages/Student';
import Transaction from './pages/Transaction';
import Category from './pages/Category';
import StudentInfo from './pages/StudentInfo';
import NotFound from './pages/NotFound';
import CategoryInfo from './pages/CategoryInfo';
import TransactionInfo from './pages/TransactionInfo';
import Login from './pages/Login';
// import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Organization from './pages/Organization';
import OrganizationInfo from './pages/OrganizationInfo';
import Settings from './pages/Settings';
import Prelisting from './pages/Prelisting';
import PrelistingInfo from './pages/PrelistingInfo';
import HasPermission from './components/HasPermission';
import { MODULES } from './constants';
import NoPermission from './pages/NoPermission';
import Users from './pages/Users';
import UserInfo from './pages/UserInfo';
import Roles from './pages/Roles';
import RoleInfo from './pages/RoleInfo';

export default function Route() {
	const route = createBrowserRouter([
		{
			path: '/',
			element: (
				<ProtectedRoute>
					<App />
				</ProtectedRoute>
			),
			errorElement: <NotFound />,
			children: [
				{
					index: true,
					element: <Dashboard />,
				},
				{
					path: '/student',
					element: (
						<HasPermission
							permissions={[MODULES.STUDENT_READ]}
							fallback={<NoPermission />}
						>
							<Student />
						</HasPermission>
					),
				},
				{
					path: '/transaction',
					element: (
						<HasPermission
							permissions={[MODULES.TRANSACTION_READ]}
							fallback={<NoPermission />}
						>
							<Transaction />
						</HasPermission>
					),
				},
				{
					path: '/prelisting',
					element: (
						<HasPermission
							permissions={[MODULES.PRELISTING_READ]}
							fallback={<NoPermission />}
						>
							<Prelisting />
						</HasPermission>
					),
				},
				{
					path: '/category',
					element: (
						<HasPermission
							permissions={[MODULES.CATEGORY_READ]}
							fallback={<NoPermission />}
						>
							<Category />
						</HasPermission>
					),
				},
				{
					path: '/student/:studentID',
					element: (
						<HasPermission
							permissions={[MODULES.STUDENT_READ]}
							fallback={<NoPermission />}
						>
							<StudentInfo />
						</HasPermission>
					),
				},
				{
					path: '/category/:categoryID',
					element: (
						<HasPermission
							permissions={[MODULES.CATEGORY_READ]}
							fallback={<NoPermission />}
						>
							<CategoryInfo />
						</HasPermission>
					),
				},
				{
					path: '/transaction/:transactionID',
					element: (
						<HasPermission
							permissions={[MODULES.TRANSACTION_READ]}
							fallback={<NoPermission />}
						>
							<TransactionInfo />
						</HasPermission>
					),
				},
				{
					path: '/prelisting/:prelistingID',
					element: (
						<HasPermission
							permissions={[MODULES.PRELISTING_READ]}
							fallback={<NoPermission />}
						>
							<PrelistingInfo />
						</HasPermission>
					),
				},
				{
					path: '/organization',
					element: (
						<HasPermission
							permissions={[MODULES.ORGANIZATION_READ]}
							fallback={<NoPermission />}
						>
							<Organization />
						</HasPermission>
					),
				},
				{
					path: '/organization/:organizationID',
					element: (
						<HasPermission
							permissions={[MODULES.ORGANIZATION_READ]}
							fallback={<NoPermission />}
						>
							<OrganizationInfo />
						</HasPermission>
					),
				},
				{
					path: '/user',
					element: (
						<HasPermission
							permissions={[MODULES.USER_READ]}
							fallback={<NoPermission />}
						>
							<Users />
						</HasPermission>
					),
				},
				{
					path: '/user/:userID',
					element: (
						<HasPermission
							permissions={[MODULES.USER_READ]}
							fallback={<NoPermission />}
						>
							<UserInfo />
						</HasPermission>
					),
				},
				{
					path: '/role',
					element: (
						<HasPermission
							permissions={[MODULES.ROLE_READ]}
							fallback={<NoPermission />}
						>
							<Roles />
						</HasPermission>
					),
				},
				{
					path: '/role/:roleID',
					element: (
						<HasPermission
							permissions={[MODULES.ROLE_READ, MODULES.ROLE_UPDATE]}
							fallback={<NoPermission />}
						>
							<RoleInfo />
						</HasPermission>
					),
				},
				{
					path: '/settings',
					element: <Settings />,
				},
			],
		},
		{
			path: '/login',
			element: <Login />,
		},
		// {
		// 	path: '/signup',
		// 	element: <Signup />,
		// },
	]);

	return <RouterProvider router={route} />;
}
