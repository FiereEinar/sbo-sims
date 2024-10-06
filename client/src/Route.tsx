import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Dashboard from './pages/Dashboard';
import Student from './pages/Student';
import Transaction from './pages/Transaction';
import Category from './pages/Category';

export default function Route() {
	const route = createBrowserRouter([
		{
			path: '/',
			element: <App />,
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
					path: '/category',
					element: <Category />,
				},
			],
		},
	]);

	return <RouterProvider router={route} />;
}
