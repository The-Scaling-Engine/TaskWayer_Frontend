import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { taskService } from '@/services/taskService';
import type { TaskStats } from '@/types';

import {
  CheckSquare,
  ClipboardList,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await taskService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch {
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    { icon: CheckSquare, label: 'Create Task', color: 'text-[#FE812C]' },
    { icon: ClipboardList, label: 'Plan Today', color: 'text-primary' },
    { icon: Clock, label: 'Review Blocked', color: 'text-[#E298B9]' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome Back, {user?.name || user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your tasks.</p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick Actions Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-foreground">How can I help you today?</h3>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-sm font-medium transition-colors group"
                >
                  <Icon size={18} className={action.color} />
                  <span className="flex-1 text-left">{action.label}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Progress Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Task Progress</h3>
              <p className="text-xs text-muted-foreground">Your current workflow snapshot</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Live</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{stats.done}</p>
                  <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#FE812C]">{stats.doing}</p>
                  <p className="text-xs text-muted-foreground mt-1">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{stats.todo}</p>
                  <p className="text-xs text-muted-foreground mt-1">To Do</p>
                </div>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary shrink-0" />
                <span className="text-xs font-medium text-primary">
                  {stats.total} total tasks tracked
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
