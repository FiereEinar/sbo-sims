import { fetchStudents } from '@/api/student';
import { AddStudentForm } from '@/components/forms/AddStudentForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { useQuery } from '@tanstack/react-query';
import { MODULES, QUERY_KEYS } from '@/constants';
import PaginationController from '@/components/PaginationController';
import { useStudentFilterStore } from '@/store/studentsFilter';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Import } from 'lucide-react';
import { queryClient } from '@/main';
import HasPermission from '@/components/HasPermission';
import StudentsCardView from '@/components/student/StudentsCardView';
import { useViewModeStore } from '@/store/viewModeStore';
import StudentsTable from '@/components/student/StudentsTable';
import StudentFilter from '@/components/student/StudentFilter';
import { useUserStore } from '@/store/user';
import SyncChecker from '@/components/sync/SyncChecker';

export default function Student() {
  const user = useUserStore((state) => state.user);
  const { viewMode } = useViewModeStore();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { page, pageSize, setPage, getFilterValues } = useStudentFilterStore(
    (state) => state,
  );

  const {
    data: studentsFetchResult,
    isLoading: studentsLoading,
    error: studentsError,
  } = useQuery({
    queryKey: [QUERY_KEYS.STUDENT, getFilterValues()],
    queryFn: () => fetchStudents(getFilterValues(), page, pageSize),
  });

  const prefetchPageFn = (page: number) => {
    const filters = {
      ...getFilterValues(),
      page: page,
    };

    const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);
    if (data) return;

    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.STUDENT, filters],
      queryFn: () => fetchStudents(filters, page, pageSize),
    });
  };

  if (studentsError) {
    return <p>Session expired, login again.</p>;
  }

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <div className="flex flex-col gap-1">
          <Header>Students</Header>
          <div className="flex items-center gap-3 flex-wrap py-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground w-fit">
              <AlertCircle className="w-3.5 h-3.5" />
              Showing data for{' '}
              <strong>
                SY {user?.activeSchoolYearDB} — Semester {user?.activeSemDB}
              </strong>
            </div>
            <SyncChecker
              module="Student"
              semester={user?.activeSemDB}
              schoolYear={user?.activeSchoolYearDB}
            />
          </div>
        </div>

        <div className="flex gap-2  items-center">
          <HasPermission permissions={[MODULES.STUDENT_IMPORT]}>
            <Button
              asChild
              className="rounded-full flex items-center gap-2"
              variant="ghost"
            >
              <Link to={`/${orgSlug}/student/import`}>
                <Import className="size-4" />
                Import
              </Link>
            </Button>
          </HasPermission>

          <HasPermission permissions={[MODULES.STUDENT_CREATE]}>
            <AddStudentForm />
          </HasPermission>
        </div>
      </StickyHeader>

      <div className="flex justify-between items-end flex-wrap gap-3">
        <StudentFilter />
        {/* <ViewModeToggle /> */}
      </div>

      {viewMode === 'table' ? (
        <StudentsTable
          isLoading={studentsLoading}
          students={studentsFetchResult?.data}
        />
      ) : (
        <StudentsCardView
          students={studentsFetchResult?.data}
          isLoading={studentsLoading}
        />
      )}

      {studentsFetchResult && (
        <PaginationController
          currentPage={page ?? 1}
          nextPage={studentsFetchResult.next}
          prevPage={studentsFetchResult.prev}
          setPage={setPage}
          prefetchFn={prefetchPageFn}
        />
      )}
    </SidebarPageLayout>
  );
}
