import { useEffect, useState, useCallback } from 'react';
import { analyticsService } from '@/services/analyticsService';
import type { AnalyticsSummary, AnalyticsCompletion, AnalyticsTrend, AnalyticsTimeEntry, AnalyticsHeatmapEntry } from '@/types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CheckSquare, Clock, TrendingUp, AlertTriangle, Loader2, BarChart2, Timer } from 'lucide-react';

type Range = '7D' | '30D' | '90D';

function getRangeDates(range: Range): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (range === '7D' ? 7 : range === '30D' ? 30 : 90));
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function formatSeconds(seconds: number): string {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function tickDate(value: string): string {
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : value;
}

const tooltipStyle = {
  backgroundColor: 'var(--card, #fff)',
  borderRadius: '12px',
  border: '1px solid var(--border, #E5E7EB)',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  color: 'var(--foreground, #1A1A1A)',
  fontSize: 13,
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [completion, setCompletion] = useState<AnalyticsCompletion[]>([]);
  const [trends, setTrends] = useState<AnalyticsTrend[]>([]);
  const [timeData, setTimeData] = useState<AnalyticsTimeEntry | null>(null);
  const [heatmap, setHeatmap] = useState<AnalyticsHeatmapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('30D');

  const fetchRangeData = useCallback(async (r: Range) => {
    try {
      const params = getRangeDates(r);
      const [compRes, trendRes] = await Promise.all([
        analyticsService.getCompletion(params),
        analyticsService.getTrends(params),
      ]);
      setCompletion(compRes.success && Array.isArray(compRes.data) ? compRes.data : []);
      setTrends(trendRes.success && Array.isArray(trendRes.data) ? trendRes.data : []);
    } catch {
      setCompletion([]);
      setTrends([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [summaryRes, timeRes, heatmapRes] = await Promise.allSettled([
          analyticsService.getSummary(),
          analyticsService.getTimeTracking(),
          analyticsService.getHeatmap(),
        ]);
        if (summaryRes.status === 'fulfilled' && summaryRes.value.success) setSummary(summaryRes.value.data);
        if (timeRes.status === 'fulfilled' && timeRes.value.success) setTimeData(timeRes.value.data);
        if (heatmapRes.status === 'fulfilled' && heatmapRes.value.success) {
          setHeatmap(Array.isArray(heatmapRes.value.data) ? heatmapRes.value.data : []);
        }
      } catch {
        // silent fail – widgets show empty state
      } finally {
        setLoading(false);
      }
      await fetchRangeData(range);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) fetchRangeData(range);
  }, [range, fetchRangeData]);

  const heatmapMax = Math.max(...heatmap.map((h) => h.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Your personal task performance and productivity overview</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-muted-foreground font-medium">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-primary">{summary?.totalTasks ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CheckSquare className="text-primary" size={20} />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-emerald-500">{summary?.completedTasks ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{summary?.completionRate ?? 0}% rate</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-emerald-500" size={20} />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">In Progress</p>
                <p className="text-2xl font-bold text-[#FE812C]">{summary?.inProgressTasks ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-[#FE812C]/10 rounded-xl flex items-center justify-center">
                <Clock className="text-[#FE812C]" size={20} />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{summary?.overdueTasksCount ?? 0}</p>
              </div>
              <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-destructive" size={20} />
              </div>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Time range:</span>
            {(['7D', '30D', '90D'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  range === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion chart */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Completion Rate</h3>
                <p className="text-xs text-muted-foreground">Completed vs total tasks over time</p>
              </div>
              {completion.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <BarChart2 size={28} className="opacity-30 mr-2" />
                  <span className="text-sm">No data for this period</span>
                </div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={completion} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={tickDate} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Line type="monotone" dataKey="completed" stroke="#10BA41" strokeWidth={2} dot={false} name="Completed" />
                      <Line type="monotone" dataKey="total" stroke="#6B7280" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Total" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Trends chart */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Activity Trends</h3>
                <p className="text-xs text-muted-foreground">Tasks created vs completed per day</p>
              </div>
              {trends.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                  <BarChart2 size={28} className="opacity-30 mr-2" />
                  <span className="text-sm">No data for this period</span>
                </div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={tickDate} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar dataKey="created" fill="#FE812C" radius={[4, 4, 0, 0]} name="Created" />
                      <Bar dataKey="completed" fill="#10BA41" radius={[4, 4, 0, 0]} name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Time tracking + Heatmap row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time tracking summary */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Timer size={16} className="text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Time Tracking</h3>
              </div>
              {!timeData ? (
                <p className="text-sm text-muted-foreground">No time tracking data yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{formatSeconds(timeData.totalSeconds)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#FE812C]">{timeData.sessionCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{formatSeconds(timeData.avgSessionSeconds)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg session</p>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Heatmap */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground">Activity Heatmap</h3>
                <p className="text-xs text-muted-foreground">Task completions by day</p>
              </div>
              {heatmap.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <span className="text-sm">No activity data yet.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {heatmap.slice(-63).map((entry) => {
                    const intensity = entry.count / heatmapMax;
                    const opacity = entry.count === 0 ? 0.08 : 0.2 + intensity * 0.8;
                    return (
                      <div
                        key={entry.date}
                        title={`${entry.date}: ${entry.count} tasks`}
                        className="w-4 h-4 rounded-sm cursor-default"
                        style={{ backgroundColor: `rgba(16, 186, 65, ${opacity})` }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
