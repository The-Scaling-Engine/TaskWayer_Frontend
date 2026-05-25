import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/store/taskStore';
import { useSocketStore } from '@/store/socketStore';
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import CommentDialog from '@/components/CommentDialog';
import type { Task } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';

interface Column {
  id: 'todo' | 'doing' | 'done';
  title: string;
  color: string;
}

interface TaskSubmitData {
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  deadline?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  departmentId?: string;
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  recurrenceEndDate?: string | null;
}

interface PendingUpdate {
  taskId: string;
  taskTitle: string;
  data: TaskSubmitData;
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'doing', title: 'In Progress', color: 'bg-[#FE812C]' },
  { id: 'done', title: 'Done', color: 'bg-primary' },
];

interface DraggableTaskCardProps {
  task: Task;
  isActiveDrag: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComment: (task: Task) => void;
  onCancelRecurring: (task: Task) => void;
  commentCount?: number;
  hideDeptLabel?: boolean;
}

function DraggableTaskCard({ task, isActiveDrag, onEdit, onDelete, onComment, onCancelRecurring, commentCount, hideDeptLabel }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task._id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isActiveDrag ? 'opacity-30' : undefined}
    >
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onComment={onComment}
        onCancelRecurring={onCancelRecurring}
        commentCount={commentCount}
        hideDeptLabel={hideDeptLabel}
      />
    </div>
  );
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2.5 min-h-[120px] rounded-xl p-2.5 transition-colors duration-150 ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset' : 'bg-muted/30'
      }`}
    >
      {children}
    </div>
  );
}

export interface KanbanBoardRef {
  openCreateTask: () => void;
  openTaskById: (taskId: string, highlightCommentId?: string) => void;
}

interface KanbanBoardProps {
  hideDeptLabel?: boolean;
  filterFn?: (task: Task) => boolean;
  lockedDepartmentId?: string;
  lockedDepartmentName?: string;
}

const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(({ hideDeptLabel, filterFn, lockedDepartmentId, lockedDepartmentName }, ref) => {
  const { tasks, loading, createTask, updateTask, deleteTask, moveTask, cancelRecurrence, silentFetch } = useTaskStore();
  const { socket } = useSocketStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [updateConfirm, setUpdateConfirm] = useState<PendingUpdate | null>(null);
  const [cancelRecurringTask, setCancelRecurringTask] = useState<Task | null>(null);
  const [keepChildren, setKeepChildren] = useState(false);
  const [cancelRecurringLoading, setCancelRecurringLoading] = useState(false);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | undefined>(undefined);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    if (!socket) return;
    const handler = () => { void silentFetch(); };
    socket.on('task:statusUpdated', handler);
    return () => { socket.off('task:statusUpdated', handler); };
  }, [socket, silentFetch]);

  useImperativeHandle(ref, () => ({
    openCreateTask: () => handleCreate(),
    openTaskById: (taskId: string, hcId?: string) => {
      const task = tasks.find((t) => t.id === taskId || t._id === taskId);
      if (!task) return;
      if (hcId) {
        setHighlightCommentId(hcId);
        setCommentTask(task);
      } else {
        handleEdit(task);
      }
    },
  }));

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as 'todo' | 'doing' | 'done';
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await moveTask(taskId, newStatus);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to move task'));
    }
  };

  const handleCreate = (columnStatus?: 'todo' | 'doing' | 'done') => {
    setEditingTask(null);
    if (columnStatus) {
      setEditingTask({ _id: '', title: '', description: '', status: columnStatus, userId: '', createdAt: '', updatedAt: '' } as Task);
    }
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = async (task: Task) => {
    setDeleteConfirm(task);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteTask(deleteConfirm._id);
        toast.success('Task deleted successfully');
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to delete task'));
      }
      setDeleteConfirm(null);
    }
  };

  const confirmCancelRecurring = async () => {
    if (!cancelRecurringTask) return;
    setCancelRecurringLoading(true);
    try {
      const message = await cancelRecurrence(cancelRecurringTask._id, keepChildren);
      toast.success(message);
      setCancelRecurringTask(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to cancel recurring task'));
    } finally {
      setCancelRecurringLoading(false);
    }
  };

  const confirmUpdate = async () => {
    if (updateConfirm) {
      setDialogLoading(true);
      try {
        await updateTask(updateConfirm.taskId, updateConfirm.data);
        toast.success('Task updated successfully');
        setUpdateConfirm(null);
        setDialogOpen(false);
        setEditingTask(null);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to update task'));
      } finally {
        setDialogLoading(false);
      }
    }
  };

  const handleSubmit = async (data: TaskSubmitData) => {
    if (editingTask && editingTask._id) {
      // Close the edit dialog first, then show update confirmation popup
      setDialogOpen(false);
      setUpdateConfirm({
        taskId: editingTask._id,
        taskTitle: data.title,
        data,
      });
    } else {
      // Create directly (no confirmation needed)
      setDialogLoading(true);
      try {
        await createTask(data);
        toast.success('Task created successfully');
        setDialogOpen(false);
        setEditingTask(null);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to create task'));
      } finally {
        setDialogLoading(false);
      }
    }
  };

  const getTasksByStatus = (status: string) =>
    tasks
      .filter((t) => t.status === status && (!filterFn || filterFn(t)))
      .sort((a, b) => {
        const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
      });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => {
            const colTasks = getTasksByStatus(col.id);
            return (
              <div key={col.id} className="space-y-3">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="font-semibold text-foreground text-sm">{col.title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCreate(col.id)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={`Add task to ${col.title}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Column Body */}
                <DroppableColumn id={col.id}>
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <p className="text-xs">No tasks yet</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <DraggableTaskCard
                        key={task._id}
                        task={task}
                        isActiveDrag={activeTask?._id === task._id}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onComment={(t) => setCommentTask(t)}
                        onCancelRecurring={(t) => { setKeepChildren(false); setCancelRecurringTask(t); }}
                        commentCount={commentCounts[task._id]}
                        hideDeptLabel={hideDeptLabel}
                      />
                    ))
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-2 opacity-90 shadow-2xl">
              <TaskCard
                task={activeTask}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onComment={(t) => setCommentTask(t)}
                commentCount={commentCounts[activeTask._id]}
                hideDeptLabel={hideDeptLabel}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create/Edit Dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        task={editingTask}
        loading={dialogLoading}
        lockedDepartmentId={!editingTask ? lockedDepartmentId : undefined}
        lockedDepartmentName={!editingTask ? lockedDepartmentName : undefined}
      />

      {/* Update Confirmation Dialog */}
      {updateConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Update Task</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to update "{updateConfirm.taskTitle}"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setUpdateConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdate}
                disabled={dialogLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-[#FE812C] text-white hover:bg-[#e5732a] transition-colors"
              >
                {dialogLoading ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Dialog */}
      {commentTask && (
        <CommentDialog
          open={!!commentTask}
          onClose={() => { setCommentTask(null); setHighlightCommentId(undefined); }}
          task={commentTask}
          onCountUpdate={(taskId, count) =>
            setCommentCounts((prev) => ({ ...prev, [taskId]: count }))
          }
          highlightCommentId={highlightCommentId}
        />
      )}

      {/* Cancel Recurring Dialog */}
      {cancelRecurringTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Cancel Recurring Task</h3>
            <p className="text-sm text-muted-foreground">
              What would you like to do with the existing copies of "{cancelRecurringTask.title}"?
            </p>
            <div className="space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="keepChildren"
                  checked={!keepChildren}
                  onChange={() => setKeepChildren(false)}
                  className="mt-0.5 accent-[#FE812C]"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Delete unstarted copies</p>
                  <p className="text-xs text-muted-foreground">Remove all "To Do" copies. Keep "In Progress" and "Done" copies.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="keepChildren"
                  checked={keepChildren}
                  onChange={() => setKeepChildren(true)}
                  className="mt-0.5 accent-[#FE812C]"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Keep all existing copies</p>
                  <p className="text-xs text-muted-foreground">Only stop generating new copies. All existing copies remain.</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCancelRecurringTask(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelRecurring}
                disabled={cancelRecurringLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                {cancelRecurringLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete Task</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default KanbanBoard;
