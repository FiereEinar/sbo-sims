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
import { AttendanceFilterValues } from '@/api/attendance';

type AttendanceRecordTableProps = {
  records: AttendanceRecord[];
  filters: AttendanceFilterValues;
  setFilters: (filters: Partial<AttendanceFilterValues>) => void;
  courses: string[];
};

export default function AttendanceRecordTable({
  records,
  filters,
  setFilters,
  courses,
}: AttendanceRecordTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="select-none">
            <TableHead className="w-[120px]">Student ID</TableHead>
            <TableHead className="w-[220px]">
              {/* Name Sort */}
              <Select
                value={['name_asc', 'name_desc'].includes(filters.sortBy || '') ? filters.sortBy : 'name_none'}
                onValueChange={(v) =>
                  setFilters({
                    sortBy:
                      v === 'name_none'
                        ? 'time_desc'
                        : (v as AttendanceFilterValues['sortBy']),
                  })
                }
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
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
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
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
            <TableHead className="w-[150px]">
              {/* Course Filter */}
              <Select
                value={filters.course || 'All'}
                onValueChange={(v) => setFilters({ course: v })}
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...courses].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === 'All' ? 'Course: All' : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead className="w-[80px]">
              {/* Year Filter */}
              <Select
                value={filters.year || 'All'}
                onValueChange={(v) => setFilters({ year: v })}
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0">
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
            <TableHead className="w-[180px]">
              {/* Time Recorded Sort */}
              <Select
                value={['time_asc', 'time_desc'].includes(filters.sortBy || '') ? filters.sortBy : 'time_none'}
                onValueChange={(v) =>
                  setFilters({
                    sortBy:
                      v === 'time_none'
                        ? 'time_desc'
                        : (v as AttendanceFilterValues['sortBy']),
                  })
                }
              >
                <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
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
                colSpan={6}
                className="text-center p-8 text-muted-foreground"
              >
                No attendance records found for this session yet.
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record._id}>
                <TableCell className="font-medium">
                  {record.student.studentID}
                </TableCell>
                <TableCell>
                  {startCase(`${record.student.firstname} ${record.student.lastname}`)}
                </TableCell>
                <TableCell>{record.student.gender}</TableCell>
                <TableCell>{record.student.course}</TableCell>
                <TableCell>{record.student.year}</TableCell>
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
