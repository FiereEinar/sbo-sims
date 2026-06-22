import { AttendanceRecord } from '@/types/attendance';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AttendanceRecordTableProps = {
  records: AttendanceRecord[];
};

export default function AttendanceRecordTable({
  records,
}: AttendanceRecordTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20 text-muted-foreground">
        No attendance records found for this session yet.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Course & Year</TableHead>
            <TableHead>Time Recorded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record._id}>
              <TableCell className="font-medium">
                {record.student.studentID}
              </TableCell>
              <TableCell>
                {record.student.firstname} {record.student.lastname}
              </TableCell>
              <TableCell>
                {record.student.course} - {record.student.year}
              </TableCell>
              <TableCell>
                {format(new Date(record.recordedAt), 'MMM d, yyyy h:mm a')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
