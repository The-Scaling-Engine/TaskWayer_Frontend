import { useEffect, useState, useCallback } from 'react';
import { timesheetService } from '@/services/timesheetService';
import type { TimesheetSummary, TimesheetSession } from '@/services/timesheetService';
import { useProjectStore } from '@/store/projectStore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Clock, Timer, Loader2, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────

type Range = '7D' | '30D' | '90D';
const LIMIT = 10;
const PIE_COLORS = ['#FE812C', '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6', '#8B5CF6'];

const tooltipStyle = {
  backgroundColor: 'var(--card, #fff)',
  borderRadius: '12px',
  border: '1px solid var(--border, #E5E7EB)',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  color: 'var(--foreground, #1A1A1A)',
  fontSize: 13,
};

// ─── Helpers ──────────────────────────────────────────────────

function getRangeDates(range: Range): { startDate: string; endDate: string } {
  const end   = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (range === '7D' ? 6 : range === '30D' ? 29 : 89));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10),
  };
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? ` ${m}m` : ''}`.trim();
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────

export default function TimesheetPage() {
  const projects = useProjectStore((s) => s.projects);

  const [summary, setSummary]               = useState<TimesheetSummary | null>(null);
  const [sessions, setSessions]             = useState<TimesheetSession[]>([]);
  const [sessionTotal, setSessionTotal]     = useState(0);
  const [page, setPage]                     = useState(1);
  const [loading, setLoading]               = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [range, setRange]                   = useState<Range>('7D');
  const [selectedProject, setSelectedProject] = useState('');

  const { startDate, endDate } = getRangeDates(range);
  const rangeDays = range === '7D' ? 7 : range === '30D' ? 30 : 90;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timesheetService.getSummary({
        startDate,
        endDate,
        ...(selectedProject ? { projectId: selectedProject } : {}),
      });
      if (res.success) setSummary(res.data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedProject]);

  const fetchSessions = useCallback(async (p: number) => {
    setSessionsLoading(true);
    try {
      const res = await timesheetService.getSessions({
        startDate,
        endDate,
        ...(selectedProject ? { projectId: selectedProject } : {}),
        page:  p,
        limit: LIMIT,
      });
      if (res.success) {
        setSessions(res.data.sessions);
        setSessionTotal(res.data.total);
      }
    } catch {
      setSessions([]);
      setSessionTotal(0);
    } finally {
      setSessionsLoading(false);
    }
  }, [startDate, endDate, selectedProject]);

  useEffect(() => {
    setPage(1);
    void fetchSummary();
    void fetchSessions(1);
  }, [fetchSummary, fetchSessions]);

  const handlePageChange = (p: number) => {
    setPage(p);
    void fetchSessions(p);
  };

  const totalPages = Math.ceil(sessionTotal / LIMIT);
  const avgSeconds = summary ? Math.round(summary.totalSeconds / rangeDays) : 0;

  // Bar chart data — hours per day
  const barData = (summary?.byDay ?? []).map((d) => ({
    date:  d.date.slice(5).replace('-', '/'),
    hours: parseFloat((d.seconds / 3600).toFixed(1)),
  }));

  // Pie chart data — hours per project
  const pieData = (summary?.byProject ?? []).map((p) => ({
    name:  p.name,
    value: parseFloat((p.seconds / 3600).toFixed(1)),
  }));

  const hasData = (summary?.totalSeconds ?? 0) > 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timesheet</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your time tracking across tasks and projects</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Project filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-sm rounded-xl border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[180px]"
          >
            <option value="">All Projects</option>
            {projects
              .filter((p) => !p.archivedAt && !p.deletedAt)
              .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
            }
          </select>

          {/* Range selector */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(['7D', '30D', '90D'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  range === r
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock size={15} />
                <span className="text-xs font-medium uppercase tracking-wide">Total Time</span>
              </div>
              <p className="text-2xl font-bold">{formatDuration(summary?.totalSeconds ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">in the last {rangeDays} days</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Timer size={15} />
                <span className="text-xs font-medium uppercase tracking-wide">Sessions</span>
              </div>
              <p className="text-2xl font-bold">{sessionTotal}</p>
              <p className="text-xs text-muted-foreground mt-1">completed sessions</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CalendarDays size={15} />
                <span className="text-xs font-medium uppercase tracking-wide">Avg / Day</span>
              </div>
              <p className="text-2xl font-bold">{formatDuration(avgSeconds)}</p>
              <p className="text-xs text-muted-foreground mt-1">average per day</p>
            </div>
          </div>

          {/* Charts */}
          {!hasData ? (
            <div className="bg-card border border-border rounded-2xl p-16 flex flex-col items-center gap-3 text-muted-foreground">
              <Clock size={40} className="opacity-20" />
              <p className="text-sm font-medium">No time tracked in this period</p>
              <p className="text-xs opacity-70">Start a tracking session on any task to see data here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar chart — hours by day */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-4">Hours by Day</h3>
                {barData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="h" />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => [`${Number(v ?? 0)}h`, 'Hours']}
                      />
                      <Bar dataKey="hours" fill="#FE812C" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie chart — time by project */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold mb-4">Time by Project</h3>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v) => [`${Number(v ?? 0)}h`]}
                      />
                      <Legend
                        iconSize={10}
                        iconType="circle"
                        formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Sessions Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Sessions</h3>
              {sessionTotal > 0 && (
                <span className="text-xs text-muted-foreground">{sessionTotal} total</span>
              )}
            </div>

            {sessionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" size={22} />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground">
                <Timer size={28} className="opacity-20" />
                <p className="text-sm">No sessions in this period.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Task</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(s.startedAt)}
                          </td>
                          <td className="px-5 py-3 font-medium max-w-[200px] truncate">
                            {s.task?.title ?? '—'}
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {s.task?.project?.name ?? 'Personal'}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-sm">
                            {s.durationSeconds ? formatDuration(s.durationSeconds) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-5 py-3 flex items-center justify-between border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        disabled={page === totalPages}
                        onClick={() => handlePageChange(page + 1)}
                        className="px-3 py-1.5 text-xs rounded-lg border border-border disabled:opacity-40 hover:bg-muted transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
