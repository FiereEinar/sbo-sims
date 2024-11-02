export const navbarLinks = [
	{
		path: '/',
		name: 'Dashboard',
		icon: 'dashboard',
	},
	{
		path: '/student',
		name: 'Student',
		icon: 'person',
	},
	{
		path: '/transaction',
		name: 'Transaction',
		icon: 'money',
	},
	{
		path: '/category',
		name: 'Category',
		icon: 'category',
	},
	{
		path: '/organization',
		name: 'Organization',
		icon: 'organization',
	},
];

export const QUERY_KEYS = {
	STUDENT: 'students',
	TRANSACTION: 'transactions',
	ORGANIZATION: 'organizations',
	ORGANIZATION_CATEGORIES: 'organization_categories',
	CATEGORY: 'categories',
	CATEGORY_WITH_TRANSACTIONS: 'categories_with_transactions',
	STUDENT_COURSES: 'student_courses',
	STUDENT_TRANSACTIONS: 'student_transactions',
	DASHBOARD_DATA: 'dashboard_data',
};
