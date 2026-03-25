import React, { useRef } from 'react';
import KanbanBoard from '@/components/KanbanBoard';
import type { KanbanBoardRef } from '@/components/KanbanBoard';
import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskStore } from '@/store/taskStore';

export default function TasksPage() {
  const boardRef = useRef<KanbanBoardRef>(null);
  const { params, setParams, pagination } = useTaskStore();
  const [searchValue, setSearchValue] = React.useState(params.search || '');

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (params.search || '')) {
        setParams({ search: searchValue || undefined });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchValue, setParams, params.search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams({ status: e.target.value || undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setParams({ sortBy: undefined, order: undefined });
      return;
    }
    const [sortBy, order] = value.split('-');
    setParams({ sortBy, order });
  };

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Task Tracker Section */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Task Tracker</h2>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <Button onClick={() => boardRef.current?.openCreateTask()} className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl shadow-md shadow-[#FE812C]/20 gap-2">
          <Plus size={18} />
          <span className="hidden sm:inline">Create Task</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={searchValue}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-3">
          <select
            value={params.status || ''}
            onChange={handleStatusChange}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[130px] font-medium"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="doing">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select
            value={params.sortBy ? `${params.sortBy}-${params.order}` : ''}
            onChange={handleSortChange}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[150px] font-medium"
          >
            <option value="">Default Sort</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="deadline-asc">Deadline (Earliest)</option>
            <option value="deadline-desc">Deadline (Latest)</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard ref={boardRef} />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
          <div className="text-sm text-muted-foreground font-medium">
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalTasks} total tasks)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
