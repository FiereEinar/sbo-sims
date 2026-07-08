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
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed22, #2563eb22)',
              border: '1px solid rgba(124,58,237,0.3)',
            }}
          >
            <Building2 className="w-5 h-5" style={{ color: '#a78bfa' }} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {org.name}
            </p>
            <p
              className="text-xs font-mono"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              /{org.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button
            id={`resetTour-${org._id}`}
            onClick={() => onResetTour(org)}
            title="Reset Onboarding Tour"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            id={`editOrg-${org._id}`}
            onClick={() => onEdit(org)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            <Pencil className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
          </button>
          <button
            id={`deleteOrg-${org._id}`}
            onClick={() => onDelete(org)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="flex items-center gap-5 mb-4 pb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />
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
        className="w-full flex items-center justify-between text-xs transition-colors duration-200"
        style={{ color: 'rgba(255,255,255,0.4)' }}
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
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: '#c4b5fd',
              }}
            >
              {dep}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
