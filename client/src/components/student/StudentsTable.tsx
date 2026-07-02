import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  Table,
} from '../ui/table';
import { StudentFilterValues, StudentWithTransactions } from '@/types/student';
import { useEffect, useState } from 'react';
import _ from 'lodash';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useStudentFilterStore } from '@/store/studentsFilter';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { fetchAvailableCourses, fetchAvailableSections, fetchStudents } from '@/api/student';
import TableLoading from '../loading/TableLoading';
import { queryClient } from '@/main';

interface StudentsTableProps {
  students: StudentWithTransactions[] | undefined;
  isLoading: boolean;
}

export default function StudentsTable({
  students,
  isLoading,
}: StudentsTableProps) {
  const [totalAmount, setTotalAmount] = useState(0);
  const navigate = useTenantNavigate();

  useEffect(() => {
    if (students) {
      setTotalAmount(
        students.reduce((prevAmount, curr) => {
          return prevAmount + curr.totalTransactionsAmount || 0;
        }, 0),
      );
    }
  }, [students]);

  return (
    <Table>
      <TableHeader>
        <TableRow className="select-none">
          <TableHead className="w-[100px]">Student ID</TableHead>
          <TableHead className="w-[250px]">
            <TableHeadNameSort />
          </TableHead>
          <TableHead className="w-[150px]">
            <TableHeadCoursePicker />
          </TableHead>
          <TableHead className="w-[100px]">
            <TableHeadYearPicker />
          </TableHead>
          <TableHead className="w-[100px]">
            <TableHeadGenderPicker />
          </TableHead>
          <TableHead className="w-[100px]">
            <TableHeadSectionPicker />
          </TableHead>
          <TableHead className="w-[100px]">
            <TableHeadTxnSort field="txn" label="Transactions made" />
          </TableHead>
          <TableHead className="w-[200px] text-right">
            <TableHeadTxnSort field="amount" label="Transactions amount" right />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading && <TableLoading colSpan={8} />}
        {!students?.length && !isLoading && (
          <TableRow>
            <TableCell colSpan={7}>No students</TableCell>
          </TableRow>
        )}
        {students &&
          students.map((student) => (
            <TableRow
              className="cursor-pointer"
              onClick={() => navigate(`/student/${student.studentID}`)}
              key={student._id}
            >
              <TableCell className="">{student.studentID}</TableCell>
              <TableCell className="">
                {_.startCase(
                  `${student.firstname} ${student.middlename ?? ''} ${
                    student.lastname
                  }`.toLowerCase(),
                )}
              </TableCell>
              <TableCell className="">{student.course}</TableCell>
              <TableCell className="">{student.year}</TableCell>
              <TableCell className="">{student.gender}</TableCell>
              <TableCell className="">{student.section}</TableCell>
              <TableCell className="">
                {student.totalTransactions ?? 0}
              </TableCell>
              <TableCell className="text-right">
                {student.totalTransactionsAmount ?? 0}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={7}>Total</TableCell>
          <TableCell className="text-right">{totalAmount}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function TableHeadCoursePicker() {
  const { course, page, pageSize, setCourse, getFilterValues } =
    useStudentFilterStore((state) => state);
  const { data: courses } = useQuery({
    queryKey: [QUERY_KEYS.STUDENT_COURSES],
    queryFn: fetchAvailableCourses,
  });

  const prefetch = (course: string) => {
    if (course !== 'All') {
      const filters = { ...getFilterValues(), course };
      const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);

      if (data) return;

      queryClient.prefetchQuery({
        queryKey: [QUERY_KEYS.STUDENT, filters],
        queryFn: () => fetchStudents(filters, page, pageSize),
      });
    }
  };

  return (
    <div className="space-x-1">
      <Select defaultValue={course} onValueChange={(value) => setCourse(value)}>
        <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
          <SelectValue placeholder="Course" />
        </SelectTrigger>
        <SelectContent>
          {courses &&
            ['All'].concat(courses).map((course, i) => (
              <SelectItem
                key={i}
                value={course}
                onMouseEnter={() => prefetch(course)}
              >
                {course === 'All' ? 'Courses: ' + course : course}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TableHeadYearPicker() {
  const { page, pageSize, year, setYear, getFilterValues } =
    useStudentFilterStore((state) => state);
  const yearsOptions = ['All', '1', '2', '3', '4'];

  const prefetch = (selectedYear: StudentFilterValues['year']) => {
    if (selectedYear !== 'All') {
      const filters = { ...getFilterValues(), year: selectedYear };
      const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);

      if (data) return;

      queryClient.prefetchQuery({
        queryKey: [QUERY_KEYS.STUDENT, filters],
        queryFn: () => fetchStudents(filters, page, pageSize),
      });
    }
  };

  return (
    <div className="space-x-1">
      <Select
        defaultValue={year}
        onValueChange={(value) => setYear(value as StudentFilterValues['year'])}
      >
        <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          {yearsOptions.map((year, i) => (
            <SelectItem
              key={i}
              value={year}
              onMouseEnter={() => prefetch(year as StudentFilterValues['year'])}
            >
              {year === 'All' ? ' Year: ' + year : year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TableHeadGenderPicker() {
  const { page, pageSize, gender, setGender, getFilterValues } =
    useStudentFilterStore((state) => state);
  const gendersOptions = ['All', 'M', 'F'];

  const prefetch = (selectedGender: StudentFilterValues['gender']) => {
    if (selectedGender !== 'All') {
      console.log('prefetching');
      const filters = { ...getFilterValues(), gender: selectedGender };
      const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);

      if (data) return;

      queryClient.prefetchQuery({
        queryKey: [QUERY_KEYS.STUDENT, filters],
        queryFn: () => fetchStudents(filters, page, pageSize),
      });
      console.log('done prefetching');
    }
  };

  return (
    <Select
      defaultValue={gender}
      onValueChange={(value) =>
        setGender(value as StudentFilterValues['gender'])
      }
    >
      <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
        <SelectValue placeholder="Gender" />
      </SelectTrigger>
      <SelectContent>
        {gendersOptions.map((gender, i) => (
          <SelectItem
            key={i}
            value={gender}
            onMouseEnter={() =>
              prefetch(gender as StudentFilterValues['gender'])
            }
          >
            {gender === 'All' ? ' Gender: ' + gender : gender}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TableHeadNameSort() {
  const { sortBy, setSortBy } = useStudentFilterStore((state) => state);

  return (
    <div className="space-x-1">
      <Select
        value={['name_asc', 'name_desc'].includes(sortBy || '') ? sortBy : 'name_asc'}
        onValueChange={(value) => setSortBy(value as StudentFilterValues['sortBy'])}
      >
        <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
          <SelectValue placeholder="Full name" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name_asc">Name: A-Z</SelectItem>
          <SelectItem value="name_desc">Name: Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TableHeadSectionPicker() {
  const { section, setSection } = useStudentFilterStore((state) => state);
  const { data: sections } = useQuery({
    queryKey: [QUERY_KEYS.STUDENT_SECTIONS],
    queryFn: fetchAvailableSections,
  });

  return (
    <div className="space-x-1">
      <Select value={section} onValueChange={(value) => setSection(value)}>
        <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
          <SelectValue placeholder="Section" />
        </SelectTrigger>
        <SelectContent>
          {sections &&
            ['All'].concat(sections).map((s, i) => (
              <SelectItem key={i} value={s}>
                {s === 'All' ? 'Section: All' : s}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TableHeadTxnSort({
  field,
  label,
  right,
}: {
  field: 'txn' | 'amount';
  label: string;
  right?: boolean;
}) {
  const { sortBy, setSortBy } = useStudentFilterStore((state) => state);

  const ascKey = `${field}_asc` as StudentFilterValues['sortBy'];
  const descKey = `${field}_desc` as StudentFilterValues['sortBy'];
  const isActive = sortBy === ascKey || sortBy === descKey;

  return (
    <Select
      value={isActive ? sortBy : 'none'}
      onValueChange={(value) =>
        setSortBy(value === 'none' ? 'name_asc' : (value as StudentFilterValues['sortBy']))
      }
    >
      <SelectTrigger
        className={`w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground ${right ? 'justify-end pr-0 [&>span]:text-right' : ''}`}
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">{label}</SelectItem>
        <SelectItem value={ascKey!}>
          {field === 'amount' ? 'Amount: Low to High' : 'Transactions: Low to High'}
        </SelectItem>
        <SelectItem value={descKey!}>
          {field === 'amount' ? 'Amount: High to Low' : 'Transactions: High to Low'}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
