import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { User } from '@/types/user';
import _ from 'lodash';
import { format } from 'date-fns';
import { User2, Calendar } from 'lucide-react';

interface UserCardProps {
  user: User;
}

export default function UserCard({ user }: UserCardProps) {
  const navigate = useTenantNavigate();
  const fullName = _.startCase(`${user.firstname} ${user.lastname}`);

  return (
    <div
      onClick={() => navigate(`/user/${user._id}`)}
      className="cursor-pointer rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all bg-card/40"
    >
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <User2 size={24} className="text-muted-foreground shrink-0" />
          <h3 className="font-semibold text-lg truncate w-40">{fullName}</h3>
        </div>

        <div className="text-right text-sm font-medium flex items-center gap-2 shrink-0">
          <Calendar size={16} className="text-muted-foreground shrink-0" />
          {format(new Date(user.createdAt), 'MM/dd/yyyy')}
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          {/* <Shield size={20} className="text-muted-foreground shrink-0" /> */}
          <div>
            <p className="text-muted-foreground text-xs">Role</p>
            <p>{_.startCase(user.rbacRole?.name ?? user.role ?? '--')}</p>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground text-xs">Student ID</p>
          <p>{user.studentID}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* <Mail size={20} className="text-muted-foreground shrink-0" /> */}
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p>{user.email || '--'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
