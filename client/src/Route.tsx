import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MODULES } from './constants';

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
import ProtectedRoute from './components/ProtectedRoute';
import OrganizationInfo from './pages/OrganizationInfo';
import Settings from './pages/Settings';
import Prelisting from './pages/Prelisting';
import PrelistingInfo from './pages/PrelistingInfo';
import HasPermission from './components/HasPermission';
import NoPermission from './pages/NoPermission';
import Users from './pages/Users';
import UserInfo from './pages/UserInfo';
import Roles from './pages/Roles';
import RoleInfo from './pages/RoleInfo';
import ErrorPage from './pages/ErrorPage';
import Reports from './pages/Reports';
import AdminPaymentRequests from './pages/PaymentRequests';
import EventInfo from './pages/EventInfo';
import EventSessionInfo from './pages/EventSessionInfo';
import Support from './pages/Support';
import SupportThread from './pages/SupportThread';

import RootRedirect from './components/RootRedirect';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminApp from './pages/admin/AdminApp';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminSupport from './pages/admin/AdminSupport';
import AdminSupportThread from './pages/admin/AdminSupportThread';
import Events from './pages/Events';

// Student portal
import StudentLoginPage from './pages/student/StudentLoginPage';
import StudentSignupPage from './pages/student/StudentSignupPage';
import StudentApp from './pages/student/StudentApp';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentPaymentRequests from './pages/student/PaymentRequests';
import StudentMyTransactions from './pages/student/MyTransactions';
import StudentMyAttendance from './pages/student/MyAttendance';
import StudentProtectedRoute from './components/student-portal/StudentProtectedRoute';

export default function Route() {
  const route = createBrowserRouter([
    {
      path: '/',
      element: <RootRedirect />,
    },
    // ── Student Portal ───────────────────────────────────────────────────────
    {
      // /login: role chooser → student form inline OR officer org-picker
      path: '/login',
      element: <StudentLoginPage />,
      errorElement: <ErrorPage />,
    },
    {
      // /signup: student registration
      path: '/signup',
      element: <StudentSignupPage />,
      errorElement: <ErrorPage />,
    },
    {
      // /student/*: student portal shell (protected, student-role only)
      path: '/student',
      element: (
        <StudentProtectedRoute>
          <StudentApp />
        </StudentProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <StudentDashboard />,
        },
        {
          path: 'dashboard',
          element: <StudentDashboard />,
        },
        {
          path: 'payment-requests',
          element: <StudentPaymentRequests />,
        },
        {
          path: 'transactions',
          element: <StudentMyTransactions />,
        },
        {
          path: 'attendance',
          element: <StudentMyAttendance />,
        },
      ],
    },
    // ── Org Portal (Officers / Admins) ───────────────────────────────────────
    {
      path: '/:orgSlug',
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
          path: 'student',
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
          path: 'transaction',
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
          path: 'prelisting',
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
          path: 'category',
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
          path: 'payment-requests',
          element: (
            <HasPermission
              permissions={[MODULES.PAYMENT_REQUEST_READ]}
              fallback={<NoPermission />}
            >
              <AdminPaymentRequests />
            </HasPermission>
          ),
        },
        {
          path: 'student/:studentID',
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
          path: 'category/:categoryID',
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
          path: 'transaction/:transactionID',
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
          path: 'prelisting/:prelistingID',
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
          path: 'organization',
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
          path: 'organization/:organizationID',
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
          path: 'user',
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
          path: 'user/:userID',
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
          path: 'role',
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
          path: 'role/:roleID',
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
          path: 'settings',
          element: (
            <HasPermission
              permissions={[MODULES.SETTING_READ]}
              fallback={<NoPermission />}
            >
              <Settings />
            </HasPermission>
          ),
        },
        {
          path: 'reports',
          element: (
            <HasPermission
              permissions={[MODULES.REPORT_READ]}
              fallback={<NoPermission />}
            >
              <Reports />
            </HasPermission>
          ),
        },
        {
          path: 'events',
          element: (
            <HasPermission
              permissions={[MODULES.EVENT_READ]}
              fallback={<NoPermission />}
            >
              <Events />
            </HasPermission>
          ),
        },
        {
          path: 'event/:eventID',
          element: (
            <HasPermission
              permissions={[MODULES.EVENT_READ]}
              fallback={<NoPermission />}
            >
              <EventInfo />
            </HasPermission>
          ),
        },
        {
          path: 'event/:eventID/session/:sessionID',
          element: (
            <HasPermission
              permissions={[MODULES.EVENT_READ]}
              fallback={<NoPermission />}
            >
              <EventSessionInfo />
            </HasPermission>
          ),
        },
        {
          path: 'support',
          element: <Support />,
          errorElement: <ErrorPage />,
        },
        {
          path: 'support/:ticketID',
          element: <SupportThread />,
          errorElement: <ErrorPage />,
        },
      ],
    },
    // ── Officer-specific auth ─────────────────────────────────────────────────
    {
      path: '/:orgSlug/login',
      element: <Login />,
      errorElement: <ErrorPage />,
    },
    // ── Global Super Admin Portal ─────────────────────────────────────────────
    {
      path: '/admin/login',
      element: <AdminLogin />,
      errorElement: <ErrorPage />,
    },
    {
      path: '/admin',
      element: (
        <AdminProtectedRoute>
          <AdminApp />
        </AdminProtectedRoute>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <AdminDashboard />,
        },
        {
          path: 'support',
          element: <AdminSupport />,
          errorElement: <ErrorPage />,
        },
        {
          path: 'support/:ticketID',
          element: <AdminSupportThread />,
          errorElement: <ErrorPage />,
        },
      ],
    },
  ]);

  return <RouterProvider router={route} />;
}
