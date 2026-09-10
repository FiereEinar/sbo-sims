import { AttendanceRecord } from '@/types/attendance';
import { format } from 'date-fns';
import { startCase } from 'lodash';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { AttendanceFilterValues } from '@/api/attendance';


type AttendanceRecordTableProps = {
  records: AttendanceRecord[];
  isLoading?: boolean;
  filters: AttendanceFilterValues;
  setFilters: (filters: Partial<AttendanceFilterValues>) => void;
  courses: string[];
  sections: string[];
  coursePopoverOpen: boolean;
  setCoursePopoverOpen: (open: boolean) => void;
};

export default function AttendanceRecordTable({
  records,
  isLoading = false,
  filters,
  setFilters,
  courses,
  sections,
  coursePopoverOpen,
  setCoursePopoverOpen,
}: AttendanceRecordTableProps) {
  const selectedCourses = filters.courses || [];

  const toggleCourse = (course: string) => {
    const current = filters.courses || [];
    if (current.includes(course)) {
      setFilters({ courses: current.filter((c) => c !== course) });
    } else {
      setFilters({ courses: [...current, course] });
    }
  };

  const courseLabel =
    selectedCourses.length === 0
      ? 'Course: All'
      : selectedCourses.length === 1
        ? selectedCourses[0]
        : `${selectedCourses.length} Courses`;

  return (
    <div className={`border rounded-lg overflow-hidden transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <Table>
        <TableHeader>
          <TableRow className="select-none">
            <TableHead className="w-[120px]">Student ID</TableHead>
            <TableHead className="w-[220px]">
              {/* Name Sort */}
              <Select
                value={
                  ['name_asc', 'name_desc'].includes(filters.sortBy || '')
                    ? filters.sortBy
                    : 'name_none'
                }
                onValueChange={(v) =>
                  setFilters({
                    sortBy:
                      v === 'name_none'
                        ? 'time_desc'
                        : (v as AttendanceFilterValues['sortBy']),
                  })
                }
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 text-muted-foreground">
                  <SelectValue placeholder="Name" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name_none">Name</SelectItem>
                  <SelectItem value="name_asc">Name: A-Z</SelectItem>
                  <SelectItem value="name_desc">Name: Z-A</SelectItem>
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="w-[80px]">
              {/* Gender Filter */}
              <Select
                value={filters.gender || 'All'}
                onValueChange={(v) => setFilters({ gender: v })}
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 text-muted-foreground">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  {['All', 'M', 'F'].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g === 'All' ? 'Gender: All' : g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="w-[160px]">
              {/* Course Multi-Select Filter */}
              <Popover open={coursePopoverOpen} onOpenChange={setCoursePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center gap-1 text-sm w-full pl-0 py-1 focus:outline-none text-muted-foreground"
                  >
                    <span className="truncate">{courseLabel}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => setFilters({ courses: [] })}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                        selectedCourses.length === 0
                          ? 'font-semibold text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      All Courses
                    </button>
                    {courses.map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedCourses.includes(c)}
                          onCheckedChange={() => toggleCourse(c)}
                        />
                        <span className="truncate">{c}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </TableHead>
            <TableHead className="w-[80px]">
              {/* Year Filter */}
              <Select
                value={filters.year || 'All'}
                onValueChange={(v) => setFilters({ year: v })}
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 text-muted-foreground">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {['All', '1', '2', '3', '4'].map((y) => (
                    <SelectItem key={y} value={y}>
                      {y === 'All' ? 'Year: All' : y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="w-[100px]">
              {/* Section Filter */}
              <Select
                value={filters.section || 'All'}
                onValueChange={(v) => setFilters({ section: v })}
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 text-muted-foreground">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...sections].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'All' ? 'Section: All' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="w-[180px]">
              {/* Time Recorded Sort */}
              <Select
                value={
                  ['time_asc', 'time_desc'].includes(filters.sortBy || '')
                    ? filters.sortBy
                    : 'time_none'
                }
                onValueChange={(v) =>
                  setFilters({
                    sortBy:
                      v === 'time_none'
                        ? 'time_desc'
                        : (v as AttendanceFilterValues['sortBy']),
                  })
                }
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 text-muted-foreground">
                  <SelectValue placeholder="Time Recorded" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_none">Time Recorded</SelectItem>
                  <SelectItem value="time_desc">Time: Newest First</SelectItem>
                  <SelectItem value="time_asc">Time: Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center p-8 text-muted-foreground"
              >
                No attendance records found for this session yet.
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record._id}>
                <TableCell className="font-medium">
                  {record.student
                    ? record.student.studentID
                    : record.studentIdInput}
                </TableCell>
                <TableCell>
                  {record.student ? (
                    startCase(
                      `${record.student.firstname} ${record.student.lastname}`,
                    )
                  ) : (
                    <span className="text-muted-foreground italic">
                      Unmapped
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {record.student ? record.student.gender : '-'}
                </TableCell>
                <TableCell>
                  {record.student ? record.student.course : '-'}
                </TableCell>
                <TableCell>
                  {record.student ? record.student.year : '-'}
                </TableCell>
                <TableCell>
                  {record.student ? record.student.section || '-' : '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(record.recordedAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
