import { useAuthStore } from '@/store/authStore';
import {
  CheckSquare,
  ClipboardList,
  Clock,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const quickActions = [
    { icon: CheckSquare, label: 'Create Task', color: 'text-[#FE812C]' },
    { icon: ClipboardList, label: 'Plan Today', color: 'text-primary' },
    { icon: Clock, label: 'Review Blocked', color: 'text-[#E298B9]' },
  ];

  const stats = [
    { label: 'Completed', value: '22', color: 'text-primary' },
    { label: 'In Progress', value: '30', color: 'text-[#FE812C]' },
    { label: 'Blocked', value: '18', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome Back, {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your tasks.</p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* Time Tracker Card */}
        <div className="bg-gradient-to-br from-[#FE812C] to-[#e5732a] rounded-2xl p-6 text-white shadow-lg shadow-[#FE812C]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold opacity-90">Time Tracker</h3>
              <p className="text-xs opacity-70">Week total: 36h</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-32 h-32">
              {/* Circular progress ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="white" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 52 * 0.65} ${2 * Math.PI * 52 * 0.35}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">02:34</span>
                <span className="text-xs opacity-70">Elapsed</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-lg font-bold">05:26</span>
              <span className="text-xs block opacity-70">Remaining</span>
            </div>
          </div>
        </div>

        {/* Task Progress Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Task Progress</h3>
              <p className="text-xs text-muted-foreground">Weekly snapshot of your workflow</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Week</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary shrink-0" />
            <span className="text-xs font-medium text-primary">+12% compared to last week</span>
          </div>
        </div>
      </div>

      {/* Task Tracker Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Task Tracker</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Placeholder for Kanban Board (Phase 4) */}
      <div className="bg-card rounded-2xl border border-border p-8 text-center min-h-[200px] flex items-center justify-center">
        <p className="text-muted-foreground">
          Kanban board will be built in Phase 4
        </p>
      </div>
    </div>
  );
}
