import { useState } from 'react';
import { AttendanceStats } from '@/api/attendance';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AttendanceStatsPanelProps {
  stats: AttendanceStats | undefined;
  isLoading: boolean;
}

const GENDER_COLORS: Record<string, string> = {
  M: '#3b82f6', // blue-500
  F: '#ec4899', // pink-500
};

const COURSE_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#8b5cf6',
  '#0ea5e9',
  '#84cc16',
  '#fb923c',
];

const YEAR_LABELS: Record<number, string> = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year',
};

export default function AttendanceStatsPanel({
  stats,
  isLoading,
}: AttendanceStatsPanelProps) {
  const [open, setOpen] = useState(false);

  const total = stats?.total ?? 0;

  const genderData = (stats?.byGender ?? []).map((g) => ({
    name: g._id === 'M' ? 'Male' : 'Female',
    value: g.count,
    id: g._id,
  }));

  const maxCourse = Math.max(...(stats?.byCourse ?? []).map((c) => c.count), 1);
  const maxYear = Math.max(...(stats?.byYear ?? []).map((y) => y.count), 1);

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          Attendance Summary
          {total > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {total} total
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
              Loading stats...
            </p>
          ) : total === 0 ? (
            <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
              No attendance data yet.
            </p>
          ) : (
            <>
              {/* Gender Donut */}
              <div className="flex flex-col items-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  By Gender
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {genderData.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={GENDER_COLORS[entry.id] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `${value} (${total ? Math.round((value / total) * 100) : 0}%)`,
                      ]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span className="text-xs">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* By Year progress bars */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  By Year Level
                </p>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((yr) => {
                    const entry = stats?.byYear.find((y) => y._id === yr);
                    const count = entry?.count ?? 0;
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={yr}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{YEAR_LABELS[yr]}</span>
                          <span className="text-muted-foreground">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                            style={{
                              width: `${maxYear > 0 ? (count / maxYear) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Course ranked bars */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  By Course
                </p>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                  {(stats?.byCourse ?? []).map((c, i) => {
                    const pct = total ? Math.round((c.count / total) * 100) : 0;
                    return (
                      <div key={c._id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium truncate max-w-[110px]">
                            {c._id}
                          </span>
                          <span className="text-muted-foreground shrink-0 ml-2">
                            {c.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(c.count / maxCourse) * 100}%`,
                              backgroundColor:
                                COURSE_COLORS[i % COURSE_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
