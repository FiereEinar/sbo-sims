import {
  Building2,
  Calendar,
  ClipboardList,
  FileBarChart2,
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
  REPORT_SUMMARY: 'report_summary',
  REPORT_MONTHLY: 'report_monthly',
  EVENT: 'events',
  EVENT_SESSION: 'event_sessions',
  ATTENDANCE_RECORD: 'attendance_records',
  ATTENDANCE_REPORT_SUMMARY: 'attendance_report_summary',
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

  SETTING_READ: 'setting:read',
  SETTING_UPDATE: 'setting:update',

  REPORT_READ: 'report:read',
  REPORT_DOWNLOAD: 'report:download',

  EVENT_CREATE: 'event:create',
  EVENT_READ: 'event:read',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',

  EVENT_SESSION_CREATE: 'event_session:create',
  EVENT_SESSION_READ: 'event_session:read',
  EVENT_SESSION_UPDATE: 'event_session:update',
  EVENT_SESSION_DELETE: 'event_session:delete',

  ATTENDANCE_RECORD_CREATE: 'attendance_record:create',
  ATTENDANCE_RECORD_READ: 'attendance_record:read',
  ATTENDANCE_RECORD_UPDATE: 'attendance_record:update',
  ATTENDANCE_RECORD_DELETE: 'attendance_record:delete',
  ATTENDANCE_RECORD_DOWNLOAD: 'attendance_record:download',
};

export type Modules = (typeof MODULES)[keyof typeof MODULES];

export type SidebarNavLinkType = {
  name: string;
  path: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  permissions?: Modules[];
  isSeparator?: boolean;
  title?: string;
};

export const navbarLinks: SidebarNavLinkType[] = [
  {
    path: '/',
    name: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/student',
    name: 'Students',
    icon: GraduationCap,
    permissions: [MODULES.STUDENT_READ],
  },
  {
    path: '/transaction',
    name: 'Transactions',
    icon: Receipt,
    permissions: [MODULES.TRANSACTION_READ],
    isSeparator: true,
    title: 'Collection',
  },
  {
    path: '/prelisting',
    name: 'Prelistings',
    icon: ClipboardList,
    permissions: [MODULES.PRELISTING_READ],
  },
  {
    path: '/category',
    name: 'Categories',
    icon: Tags,
    permissions: [MODULES.CATEGORY_READ],
  },
  {
    path: '/reports',
    name: 'Reports',
    icon: FileBarChart2,
    permissions: [MODULES.REPORT_READ],
  },
  // {
  //   path: '/attendances',
  //   name: 'Records',
  //   icon: UserCheck,
  //   permissions: [],
  //   isSeparator: true,
  //   title: 'Attendance',
  // },
  {
    path: '/events',
    name: 'Events',
    icon: Calendar,
    permissions: [MODULES.EVENT_READ],
    isSeparator: true,
    title: 'Attendance',
  },
  {
    path: '/attendance-reports',
    name: 'Reports',
    icon: FileBarChart2,
    permissions: [MODULES.REPORT_READ],
  },
  {
    path: '/organization',
    name: 'Organization',
    icon: Building2,
    permissions: [MODULES.ORGANIZATION_READ],
    isSeparator: true,
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

export const AVAILABLE_SCHOOL_YEARS = [
  2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
];
