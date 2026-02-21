import {
	Building2,
	ClipboardList,
	GraduationCap,
	LayoutDashboard,
	LucideProps,
	Receipt,
	ShieldCheck,
	Tags,
	Users,
} from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

export const QUERY_KEYS = {
	STUDENT: 'students',
	TRANSACTION: 'transactions',
	PRELISTING: 'prelisting',
	ORGANIZATION: 'organizations',
	ORGANIZATION_CATEGORIES: 'organization_categories',
	CATEGORY: 'categories',
	CATEGORY_WITH_TRANSACTIONS: 'categories_with_transactions',
	STUDENT_COURSES: 'student_courses',
	STUDENT_TRANSACTIONS: 'student_transactions',
	DASHBOARD_DATA: 'dashboard_data',
	USERS: 'users',
	ROLES: 'roles',
};

export const MODULES = {
	USER_CREATE: 'user:create',
	USER_READ: 'user:read',
	USER_UPDATE: 'user:update',
	USER_DELETE: 'user:delete',

	STUDENT_CREATE: 'student:create',
	STUDENT_READ: 'student:read',
	STUDENT_UPDATE: 'student:update',
	STUDENT_DELETE: 'student:delete',
	STUDENT_IMPORT: 'student:import',

	TRANSACTION_CREATE: 'transaction:create',
	TRANSACTION_READ: 'transaction:read',
	TRANSACTION_UPDATE: 'transaction:update',
	TRANSACTION_DELETE: 'transaction:delete',
	TRANSACTION_IMPORT: 'transaction:import',
	TRANSACTION_DOWNLOAD: 'transaction:download',

	PRELISTING_CREATE: 'prelisting:create',
	PRELISTING_READ: 'prelisting:read',
	PRELISTING_UPDATE: 'prelisting:update',
	PRELISTING_DELETE: 'prelisting:delete',

	ORGANIZATION_CREATE: 'organization:create',
	ORGANIZATION_READ: 'organization:read',
	ORGANIZATION_UPDATE: 'organization:update',
	ORGANIZATION_DELETE: 'organization:delete',

	CATEGORY_CREATE: 'category:create',
	CATEGORY_READ: 'category:read',
	CATEGORY_UPDATE: 'category:update',
	CATEGORY_DELETE: 'category:delete',

	ROLE_CREATE: 'role:create',
	ROLE_READ: 'role:read',
	ROLE_UPDATE: 'role:update',
	ROLE_DELETE: 'role:delete',
	ROLE_ASSIGN: 'role:assign',
};

export type Modules = (typeof MODULES)[keyof typeof MODULES];

export type SidebarNavLinkType = {
	name: string;
	path: string;
	icon: ForwardRefExoticComponent<
		Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
	>;
	permissions?: Modules[];
};

export const navbarLinks: SidebarNavLinkType[] = [
	{
		path: '/',
		name: 'Dashboard',
		icon: LayoutDashboard,
	},
	{
		path: '/student',
		name: 'Student',
		icon: GraduationCap,
		permissions: [MODULES.STUDENT_READ],
	},
	{
		path: '/transaction',
		name: 'Transaction',
		icon: Receipt,
		permissions: [MODULES.TRANSACTION_READ],
	},
	{
		path: '/prelisting',
		name: 'Prelisting',
		icon: ClipboardList,
		permissions: [MODULES.PRELISTING_READ],
	},
	{
		path: '/category',
		name: 'Category',
		icon: Tags,
		permissions: [MODULES.CATEGORY_READ],
	},
	{
		path: '/organization',
		name: 'Organization',
		icon: Building2,
		permissions: [MODULES.ORGANIZATION_READ],
	},
	{
		path: '/user',
		name: 'Users',
		icon: Users,
		permissions: [MODULES.USER_READ],
	},
	{
		path: '/role',
		name: 'Roles',
		icon: ShieldCheck,
		permissions: [MODULES.ROLE_READ],
	},
];
