import KanbanBoard from '@/components/KanbanBoard';

export default function TasksPage() {
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
      </div>

      {/* Kanban Board */}
      <KanbanBoard />
    </div>
  );
}
