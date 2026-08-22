import { useState } from 'react';
import {
  Building2,
  Pencil,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { AdminOrgWithStats } from '@/api/admin';
import StatBadge from './StatBadge';
import _ from 'lodash';
import { Button } from '../ui/button';

export default function OrgCard({
  org,
  onEdit,
  onDelete,
  onResetTour,
}: {
  org: AdminOrgWithStats;
  onEdit: (org: AdminOrgWithStats) => void;
  onDelete: (org: AdminOrgWithStats) => void;
  onResetTour: (org: AdminOrgWithStats) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl p-5 transition-all duration-300 bg-card/40 border border-muted-foreground/15 shadow-none hover:bg-card/60">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-foreground font-semibold text-sm truncate">
              {org.name}
            </p>
            <p className="text-xs font-mono text-muted-foreground">
              /{org.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <Button
            id={`resetTour-${org._id}`}
            onClick={() => onResetTour(org)}
            title="Reset Onboarding Tour"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button
            id={`editOrg-${org._id}`}
            onClick={() => onEdit(org)}
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-primary hover:text-primary hover:bg-primary/10"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            id={`deleteOrg-${org._id}`}
            onClick={() => onDelete(org)}
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 mb-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          <StatBadge label="Users" value={org.userCount} />
        </div>
        <StatBadge label="Governor" value={_.startCase(org.governor || '—')} />
        <StatBadge
          label="Treasurer"
          value={_.startCase(org.treasurer || '—')}
        />
      </div>

      {/* Departments collapsible */}
      <button
        id={`expandDeps-${org._id}`}
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-xs transition-colors duration-200 text-muted-foreground hover:text-foreground"
      >
        <span>
          {org.departments?.length ?? 0} Department
          {(org.departments?.length ?? 0) !== 1 ? 's' : ''}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>
      {expanded && org.departments && org.departments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {org.departments.map((dep) => (
            <span
              key={dep}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary"
            >
              {dep}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
