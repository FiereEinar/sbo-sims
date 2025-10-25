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
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Organization from './pages/Organization';
import OrganizationInfo from './pages/OrganizationInfo';
import Settings from './pages/Settings';
import Prelisting from './pages/Prelisting';
import PrelistingInfo from './pages/PrelistingInfo';

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
					element: <Student />,
				},
				{
					path: '/transaction',
					element: <Transaction />,
				},
				{
					path: '/prelisting',
					element: <Prelisting />,
				},
				{
					path: '/category',
					element: <Category />,
				},
				{
					path: '/student/:studentID',
					element: <StudentInfo />,
				},
				{
					path: '/category/:categoryID',
					element: <CategoryInfo />,
				},
				{
					path: '/transaction/:transactionID',
					element: <TransactionInfo />,
				},
				{
					path: '/prelisting/:prelistingID',
					element: <PrelistingInfo />,
				},
				{
					path: '/organization',
					element: <Organization />,
				},
				{
					path: '/organization/:organizationID',
					element: <OrganizationInfo />,
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
		{
			path: '/signup',
			element: <Signup />,
		},
	]);

	return <RouterProvider router={route} />;
}
