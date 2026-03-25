import { useAuthStore } from '@/store/authStore';

import {
  CheckSquare,
  ClipboardList,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const tasks = useTaskStore((s) => s.tasks);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const inProgressCount = tasks.filter((t) => t.status === 'doing').length;
  const todoCount = tasks.filter((t) => t.status === 'todo').length;

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
          Welcome Back, {user?.email?.split('@')[0] || 'User'}
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
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#FE812C]">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground mt-1">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{todoCount}</p>
              <p className="text-xs text-muted-foreground mt-1">To Do</p>
            </div>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary shrink-0" />
            <span className="text-xs font-medium text-primary">
              {tasks.length} total tasks tracked
            </span>
          </div>
        </div>
      </div>


    </div>
  );
}
