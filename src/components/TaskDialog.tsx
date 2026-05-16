import { useState, useEffect, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task } from '@/types';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { useDepartmentStore } from '@/store/departmentStore';
import { toast } from 'sonner';
import { Play, Square, Loader2 as TimerLoader } from 'lucide-react';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    status: 'todo' | 'doing' | 'done';
    deadline?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    departmentId?: string;
  }) => void;
  task?: Task | null;
  loading?: boolean;
}

export default function TaskDialog({ open, onClose, onSubmit, task, loading }: TaskDialogProps) {
  const { activeSession, elapsedSeconds, loading: timerLoading, startTracking, stopTracking } = useTimeTrackingStore();
  const allMemberships = useDepartmentStore((s) => s.allMemberships);

  const isThisTaskTracked = !!task?._id && activeSession?.taskId === task._id;
  const isOtherTaskTracked = !!activeSession && !isThisTaskTracked;

  const handleTimerToggle = async () => {
    if (isThisTaskTracked) {
      try {
        await stopTracking();
        toast.success('Timer stopped');
      } catch {
        toast.error('Failed to stop timer');
      }
    } else if (task?._id) {
      try {
        await startTracking(task._id);
        toast.success('Timer started');
      } catch {
        toast.error('Failed to start timer');
      }
    }
  };

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<'todo' | 'doing' | 'done'>(task?.status || 'todo');
  const [deadline, setDeadline] = useState(task?.deadline?.split('T')[0] || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [tagsInput, setTagsInput] = useState(task?.tags?.join(', ') || '');
  const [departmentId, setDepartmentId] = useState(task?.departmentId || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setStatus(task?.status || 'todo');
      setDeadline(task?.deadline?.split('T')[0] || '');
      setPriority(task?.priority || 'medium');
      setTagsInput(task?.tags?.join(', ') || '');
      setDepartmentId(task?.departmentId || '');
      setError('');
    }
  }, [task, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setDeadline('');
    setPriority('medium');
    setTagsInput('');
    setDepartmentId('');
    setError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(deadline + 'T00:00:00');
      if (selected < today) {
        setError('Deadline cannot be in the past');
        return;
      }
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      deadline: deadline || undefined,
      priority,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      departmentId: departmentId || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="text-xl font-bold flex-1">
              {task?._id ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>

            {/* Timer button – edit mode only */}
            {task?._id && (
              <button
                type="button"
                onClick={handleTimerToggle}
                disabled={timerLoading || isOtherTaskTracked}
                title={isOtherTaskTracked ? 'Another task is being tracked' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                  isThisTaskTracked
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {timerLoading ? (
                  <TimerLoader size={13} className="animate-spin" />
                ) : isThisTaskTracked ? (
                  <Square size={13} />
                ) : (
                  <Play size={13} />
                )}
                {isThisTaskTracked ? formatElapsed(elapsedSeconds) : 'Start Timer'}
              </button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Enter task title..."
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              className="rounded-xl"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Add a description (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'todo' | 'doing' | 'done')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="doing">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-deadline">Deadline</Label>
              <Input
                id="task-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-tags">Tags (comma-separated)</Label>
              <Input
                id="task-tags"
                type="text"
                placeholder="bug, feature, etc."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {allMemberships.length > 0 && (
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="None (Personal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Personal)</SelectItem>
                  {allMemberships.map((m) => (
                    <SelectItem key={m.id} value={m.department.id}>
                      {m.department.name}
                      <span className="ml-2 text-[10px] text-muted-foreground">[{m.role}]</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#FE812C] hover:bg-[#e5732a] text-white"
            >
              {loading ? 'Saving...' : task?._id ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
