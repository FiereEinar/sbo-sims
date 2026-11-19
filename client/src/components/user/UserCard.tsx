import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { User } from '@/types/user';
import _ from 'lodash';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Mail, Hash, Calendar, ArrowUpRight } from 'lucide-react';

interface UserCardProps {
  user: User;
}

function roleBgClass(role: string): string {
  if (role === 'central-admin') return 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300';
  if (role === 'org-admin') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300';
  return 'bg-muted text-muted-foreground';
}

export default function UserCard({ user }: UserCardProps) {
  const navigate = useTenantNavigate();
  const fullName = _.startCase(`${user.firstname} ${user.lastname}`);
  const initials = (() => {
    const parts = fullName.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : fullName.slice(0, 2);
  })();
  const roleName = user.rbacRole?.name ?? user.role ?? '--';

  return (
    <div
      onClick={() => navigate(`/user/${user._id}`)}
      className="group cursor-pointer rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all bg-card/40"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold uppercase shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{fullName}</h3>
            <Badge
              variant="outline"
              className={`text-[10px] rounded-full px-2 mt-1 ${roleBgClass(roleName)}`}
            >
              {_.startCase(roleName)}
            </Badge>
          </div>
        </div>
        <ArrowUpRight
          size={15}
          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
        />
      </div>

      {/* Details */}
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Hash size={12} className="shrink-0" />
          <span className="tabular-nums">{user.studentID}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={12} className="shrink-0" />
          <span className="truncate">{user.email || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={12} className="shrink-0" />
          <span className="tabular-nums">
            Joined {format(new Date(user.createdAt), 'MM/dd/yyyy')}
          </span>
        </div>
      </div>
    </div>
  );
}
