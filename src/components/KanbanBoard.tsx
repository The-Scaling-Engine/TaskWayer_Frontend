import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import CommentDialog from '@/components/CommentDialog';
import type { Task } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Column {
  id: 'todo' | 'doing' | 'done';
  title: string;
  color: string;
}

interface PendingUpdate {
  taskId: string;
  taskTitle: string;
  data: {
    title: string;
    description: string;
    status: 'todo' | 'doing' | 'done';
    deadline?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    departmentId?: string;
  };
}

const columns: Column[] = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'doing', title: 'In Progress', color: 'bg-[#FE812C]' },
  { id: 'done', title: 'Done', color: 'bg-primary' },
];

export interface KanbanBoardRef {
  openCreateTask: () => void;
}

const KanbanBoard = forwardRef<KanbanBoardRef>((_props, ref) => {
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [updateConfirm, setUpdateConfirm] = useState<PendingUpdate | null>(null);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useImperativeHandle(ref, () => ({
    openCreateTask: () => handleCreate()
  }));

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
      } catch {
        toast.error('Failed to delete task');
      }
      setDeleteConfirm(null);
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
      } catch {
        toast.error('Failed to update task');
      } finally {
        setDialogLoading(false);
      }
    }
  };

  const handleSubmit = async (data: {
    title: string;
    description: string;
    status: 'todo' | 'doing' | 'done';
    deadline?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    departmentId?: string;
  }) => {
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
      } catch {
        toast.error('Failed to create task');
      } finally {
        setDialogLoading(false);
      }
    }
  };

  const getTasksByStatus = (status: string) =>
    tasks.filter((t) => t.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <>
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
              <div className="space-y-2.5 min-h-[120px] bg-muted/30 rounded-xl p-2.5">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <p className="text-xs">No tasks yet</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onComment={(t) => setCommentTask(t)}
                      commentCount={commentCounts[task._id]}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        task={editingTask}
        loading={dialogLoading}
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
          onClose={() => setCommentTask(null)}
          task={commentTask}
          onCountUpdate={(taskId, count) =>
            setCommentCounts((prev) => ({ ...prev, [taskId]: count }))
          }
        />
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
