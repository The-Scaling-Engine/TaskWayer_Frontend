import { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Calendar, CheckCircle2, AlertCircle, Clock, Circle, Plus, X, Loader2 } from 'lucide-react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { usePlanningStore } from '@/store/planningStore';
import TaskNode from './TaskNode';
import type { PlanningMilestone, PlanningTask, PlanningSubtask, ProjectMember } from '@/types';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import { subtaskService } from '@/services/subtaskService';

interface Props {
  milestone: PlanningMilestone;
  canManage: boolean;
  projectMembers?: ProjectMember[];
  onOpenTask: (taskId: string) => void;
  onAddTask: (milestoneId: string) => void;
  projectId: string;
}

// plan2.md §5.2: 4 distinct display states
const statusConfig = {
  NOT_STARTED:  { label: 'Not started', className: 'bg-muted text-muted-foreground border-border' },
  IN_PROGRESS:  { label: 'In Progress', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  OVERDUE:      { label: 'Overdue',     className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  COMPLETED:    { label: 'Completed',   className: 'bg-primary/10 text-primary border-primary/20' },
  CANCELLED:    { label: 'Cancelled',   className: 'bg-muted text-muted-foreground border-border' },
};

export default function MilestoneNode({
  milestone, canManage, projectMembers, onOpenTask, onAddTask,
}: Props) {
  const { expandedMilestones, toggleMilestone, refresh, patchMilestones } = usePlanningStore();
  const isExpanded = expandedMilestones.has(milestone.id);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [submittingSubtask, setSubmittingSubtask] = useState(false);

  const {
    attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: milestone.id, data: { type: 'milestone' } });

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `milestone-drop-${milestone.id}`, data: { type: 'milestone-drop', milestoneId: milestone.id } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  // Derive display state from data (plan2.md §5.2)
  const allTasksDone =
    (milestone.progress.total > 0 && milestone.progress.done === milestone.progress.total) ||
    (milestone.tasks.length > 0 && milestone.tasks.every(t => t.status === 'done'));
  const statusKey =
    milestone.status === 'COMPLETED'  ? 'COMPLETED' :
    milestone.status === 'CANCELLED'  ? 'CANCELLED' :
    allTasksDone                      ? 'COMPLETED' :
    milestone.isOverdue               ? 'OVERDUE' :
    milestone.progress.total > 0      ? 'IN_PROGRESS' :
                                        'NOT_STARTED';
  const statusCfg = statusConfig[statusKey];
  const taskIds = milestone.tasks.map(t => t.id);

  const handleToggleSubtask = async (task: PlanningTask, subtask: PlanningSubtask) => {
    const newStatus = subtask.status === 'done' ? 'todo' : 'done';

    // Optimistic: update subtask in tree immediately for instant feedback
    const store = usePlanningStore.getState();
    const currentTree = store.tree;
    if (currentTree) {
      const newMilestones = currentTree.milestones.map(m => {
        if (m.id !== milestone.id) return m;
        return {
          ...m,
          tasks: m.tasks.map(t => {
            if (t.id !== task.id) return t;
            const newSubs = t.subtasks.map(s =>
              s.id === subtask.id ? { ...s, status: newStatus as 'todo' | 'doing' | 'done' } : s
            );
            const done = newSubs.filter(s => s.status === 'done').length;
            return { ...t, subtasks: newSubs, subtaskProgress: { done, total: newSubs.length } };
          }),
        };
      });
      patchMilestones(newMilestones);
    }

    try {
      await subtaskService.update(task.id, subtask.id, { status: newStatus });
      void refresh(); // background sync, no await
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update subtask'));
      await refresh(); // revert on error
    }
  };

  const handleAddSubtask = async (task: PlanningTask) => {
    if (!newSubtaskTitle.trim()) return;
    setSubmittingSubtask(true);
    try {
      await subtaskService.create(task.id, { title: newSubtaskTitle.trim() });
      setNewSubtaskTitle('');
      setAddingSubtaskFor(null);
      await refresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to add subtask'));
    } finally {
      setSubmittingSubtask(false);
    }
  };

  return (
    <div ref={setSortableRef} style={style} className="group/milestone">
      {/* Milestone header */}
      <div className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
        isOver ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-border/80'
      } shadow-sm`}>
        {/* Drag handle */}
        {canManage && (
          <button
            {...attributes} {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground opacity-40 group-hover/milestone:opacity-100 transition-opacity touch-none"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => toggleMilestone(milestone.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        {/* Milestone status icon */}
        <span className="shrink-0">
          {statusKey === 'COMPLETED'   ? <CheckCircle2 size={15} className="text-primary" /> :
           statusKey === 'OVERDUE'     ? <AlertCircle  size={15} className="text-red-500" /> :
           statusKey === 'IN_PROGRESS' ? <Clock        size={15} className="text-amber-500" /> :
           statusKey === 'CANCELLED'   ? <Circle       size={15} className="text-muted-foreground/40" /> :
                                         <Circle       size={15} className="text-muted-foreground/40" />}
        </span>

        {/* Title */}
        <span className="font-semibold text-sm text-foreground flex-1 min-w-0 truncate">
          {milestone.title}
        </span>

        {/* Progress bar */}
        {milestone.progress.total > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${milestone.progress.percent}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium w-7 text-right">
              {milestone.progress.percent}%
            </span>
          </div>
        )}

        {/* Task count */}
        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
          {milestone.progress.done}/{milestone.progress.total} tasks
        </span>

        {/* Deadline */}
        {milestone.deadline && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            <Calendar size={10} />
            {new Date(milestone.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}

        {/* Status badge */}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${statusCfg.className}`}>
          {statusCfg.label}
        </span>

        {/* Add task button */}
        {canManage && (
          <button
            onClick={() => onAddTask(milestone.id)}
            className="shrink-0 opacity-40 group-hover/milestone:opacity-100 transition-opacity p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"
            title="Add task to milestone"
            aria-label="Add task to milestone"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Tasks list (expanded) */}
      {isExpanded && (
        <div
          ref={setDropRef}
          className={`ml-4 mt-1 pl-3 border-l-2 transition-colors ${
            isOver ? 'border-primary/40' : 'border-border/30'
          } space-y-0.5 min-h-[4px]`}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {milestone.tasks.map(task => (
              <div key={task.id}>
                <TaskNode
                  task={task}
                  milestoneId={milestone.id}
                  canEdit={canManage}
                  projectMembers={projectMembers}
                  onOpenTask={onOpenTask}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={canManage ? (t) => { setAddingSubtaskFor(t.id); setNewSubtaskTitle(''); } : undefined}
                />
                {/* Inline add subtask input */}
                {addingSubtaskFor === task.id && (
                  <div className="ml-8 mt-1 flex items-center gap-1.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    <input
                      autoFocus
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddSubtask(task);
                        if (e.key === 'Escape') { setAddingSubtaskFor(null); setNewSubtaskTitle(''); }
                      }}
                      placeholder="Subtask title..."
                      className="flex-1 text-xs bg-muted/50 border border-border rounded px-2 py-1 outline-none focus:border-primary/40"
                    />
                    <button
                      onClick={() => handleAddSubtask(task)}
                      disabled={submittingSubtask || !newSubtaskTitle.trim()}
                      className="p-1 rounded hover:bg-primary/10 text-primary disabled:opacity-40"
                    >
                      {submittingSubtask ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    </button>
                    <button
                      onClick={() => { setAddingSubtaskFor(null); setNewSubtaskTitle(''); }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </SortableContext>

          {milestone.tasks.length === 0 && (
            <div className="py-3 text-center text-xs text-muted-foreground/50 italic">
              No tasks — drag one here or click + to add
            </div>
          )}
        </div>
      )}
    </div>
  );
}
