import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import KanbanBoard from '@/components/KanbanBoard';
import type { KanbanBoardRef } from '@/components/KanbanBoard';
import BulkCreatePersonalDialog from '@/components/BulkCreatePersonalDialog';
import { Search, Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/taskStore';
import DateRangePicker from '@/components/DateRangePicker';
import type { DateRange } from '@/components/DateRangePicker';
import TimerStartButton from '@/components/TimerStartButton';

export default function TasksPage() {
  const boardRef = useRef<KanbanBoardRef>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchPersonalTasks, silentRefreshPersonal } = useTaskStore();
  const [bulkDialogOpen, setBulkDialogOpen] = React.useState(false);

  // Local filter state
  const [searchValue, setSearchValue] = React.useState('');
  const [dateSort, setDateSort] = React.useState('');
  const [prioritySort, setPrioritySort] = React.useState('');
  const [deadlineFrom, setDeadlineFrom] = React.useState<string | null>(null);
  const [deadlineTo, setDeadlineTo] = React.useState<string | null>(null);

  const buildParams = React.useCallback(() => ({
    personal: true as const,
    search: searchValue || undefined,
    sortBy: dateSort ? dateSort.split('-')[0] : prioritySort ? prioritySort.split('-')[0] : undefined,
    order: dateSort ? dateSort.split('-')[1] : prioritySort ? prioritySort.split('-')[1] : undefined,
    deadlineFrom: deadlineFrom ?? undefined,
    deadlineTo: deadlineTo ?? undefined,
  }), [searchValue, dateSort, prioritySort, deadlineFrom, deadlineTo]);

  // Initial fetch
  React.useEffect(() => {
    void fetchPersonalTasks({ personal: true });
  }, [fetchPersonalTasks]);

  // Location state handling
  React.useEffect(() => {
    if (location.state?.openCreate) {
      const timer = setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.openCreateTask();
          navigate(location.pathname, { replace: true, state: {} });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    const { openTaskId, highlightCommentId } = (location.state ?? {}) as { openTaskId?: string; highlightCommentId?: string };
    if (openTaskId) {
      const timer = setTimeout(() => {
        if (boardRef.current) {
          boardRef.current.openTaskById(openTaskId, highlightCommentId);
          navigate(location.pathname, { replace: true, state: {} });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Debounced search
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchPersonalTasks(buildParams());
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeadlineRange = (range: DateRange) => {
    const from = range.from ?? null;
    const to = range.to ?? null;
    setDeadlineFrom(from);
    setDeadlineTo(to);
    void fetchPersonalTasks({
      ...buildParams(),
      deadlineFrom: from ?? undefined,
      deadlineTo: to ?? undefined,
    });
  };

  const handleDateSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setDateSort(value);
    setPrioritySort('');
    const [sb, ord] = value ? value.split('-') : [undefined, undefined];
    void fetchPersonalTasks({ ...buildParams(), sortBy: sb, order: ord });
  };

  const handlePrioritySortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPrioritySort(value);
    setDateSort('');
    const [sb, ord] = value ? value.split('-') : [undefined, undefined];
    void fetchPersonalTasks({ ...buildParams(), sortBy: sb, order: ord });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Task Tracker</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TimerStartButton fetchParams={{ status: 'doing', personal: true, limit: 50 }} />
          <Button
            variant="outline"
            onClick={() => setBulkDialogOpen(true)}
            className="rounded-xl gap-2"
          >
            <Layers size={16} />
            <span className="hidden sm:inline">Bulk Create</span>
          </Button>
          <Button onClick={() => boardRef.current?.openCreateTask()} className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl shadow-md shadow-[#FE812C]/20 gap-2">
            <Plus size={18} />
            <span className="hidden sm:inline">Create Task</span>
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* Deadline filter */}
        <DateRangePicker
          value={{ from: deadlineFrom, to: deadlineTo }}
          onChange={handleDeadlineRange}
        />

        {/* Sort controls */}
        <div className="flex flex-wrap gap-3">
          <select
            value={dateSort}
            onChange={handleDateSortChange}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[150px] font-medium"
          >
            <option value="">Sort by Date</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="deadline-asc">Deadline (Earliest)</option>
            <option value="deadline-desc">Deadline (Latest)</option>
          </select>

          <select
            value={prioritySort}
            onChange={handlePrioritySortChange}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[150px] font-medium"
          >
            <option value="">Sort by Priority</option>
            <option value="priority-desc">Priority (High to Low)</option>
            <option value="priority-asc">Priority (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard ref={boardRef} />

      <BulkCreatePersonalDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        onCreated={() => void silentRefreshPersonal()}
      />
    </div>
  );
}
