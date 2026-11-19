import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import _ from 'lodash';
import TableLoading from '../loading/TableLoading';
import { User } from '@/types/user';
import { format } from 'date-fns';

type UsersTableProps = {
  users?: User[];
  isLoading: boolean;
};

function roleBadgeClass(role: string): string {
  if (role === 'central-admin') return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300';
  if (role === 'org-admin') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300';
  return 'bg-muted text-muted-foreground';
}

function UserInitials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.slice(0, 2);
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold uppercase shrink-0">
      {initials}
    </div>
  );
}

export default function UsersTable({ users, isLoading }: UsersTableProps) {
  const navigate = useTenantNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[260px]">Member</TableHead>
          <TableHead className="w-[150px]">Student ID</TableHead>
          <TableHead className="w-[220px]">Email</TableHead>
          <TableHead className="w-[160px]">Role</TableHead>
          <TableHead className="w-[130px] text-right">Joined</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading && <TableLoading colSpan={5} />}
        {!users?.length && !isLoading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-10 italic">
              No officers found
            </TableCell>
          </TableRow>
        )}
        {users &&
          users.map((user) => {
            const fullName = _.startCase(`${user.firstname} ${user.lastname}`);
            const roleName = user.rbacRole?.name ?? user.role ?? '--';
            return (
              <TableRow
                className="cursor-pointer"
                onClick={() => navigate(`/user/${user._id}`)}
                key={user._id}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserInitials name={fullName} />
                    <span className="font-medium text-sm">{fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground text-sm">
                  {user.studentID}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.email?.length ? user.email : '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-xs rounded-full px-2.5 ${roleBadgeClass(user.rbacRole?.name ?? user.role ?? '')}`}
                  >
                    {_.startCase(roleName)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                  {format(new Date(user.createdAt), 'MM/dd/yyyy')}
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
