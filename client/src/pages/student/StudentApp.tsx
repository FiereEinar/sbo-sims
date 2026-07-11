import { Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { setNavigate } from '@/lib/navigate';
import StudentTopNavbar from '@/components/student-portal/StudentTopNavbar';
import StudentLeftSidebar from '@/components/student-portal/StudentLeftSidebar';

export default function StudentApp() {
  const navigate = useNavigate();
  setNavigate(navigate);

  return (
    <main className="transition-all bg-background flex h-dvh">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden sm:flex">
        <StudentLeftSidebar />
      </div>

      {/* Main content */}
      <div className="overflow-hidden w-full">
        <div className="flex w-full">
          <StudentTopNavbar />
        </div>
        <div className="overflow-auto h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
