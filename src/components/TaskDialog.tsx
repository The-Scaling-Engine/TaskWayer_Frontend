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

function toDatetimeLocal(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCreatedAt(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
    scheduledAt?: string | null;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    departmentId?: string;
    isRecurring?: boolean;
    recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
    recurrenceEndDate?: string | null;
  }) => void;
  task?: Task | null;
  loading?: boolean;
  defaultDeadline?: string;
  defaultScheduledAt?: string;
}

export default function TaskDialog({ open, onClose, onSubmit, task, loading, defaultDeadline, defaultScheduledAt }: TaskDialogProps) {
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
  const [deadline, setDeadline] = useState(task?.deadline ? toDatetimeLocal(task.deadline) : '');
  const [scheduledAt, setScheduledAt] = useState(task?.scheduledAt ? toDatetimeLocal(task.scheduledAt) : '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [tagsInput, setTagsInput] = useState(task?.tags?.join(', ') || '');
  const [departmentId, setDepartmentId] = useState(task?.departmentId || '__none__');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false);
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | ''>(task?.recurrenceType ?? '');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task?.recurrenceEndDate ? task.recurrenceEndDate.substring(0, 10) : '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(task?.title || '');
      setDescription(task?.description || '');
      setStatus(task?.status || 'todo');
      setDeadline(task?.deadline ? toDatetimeLocal(task.deadline) : defaultDeadline ? `${defaultDeadline}T09:00` : '');
      setScheduledAt(
        task?.scheduledAt
          ? toDatetimeLocal(task.scheduledAt)
          : defaultScheduledAt
            ? defaultScheduledAt.includes('T') ? defaultScheduledAt : `${defaultScheduledAt}T09:00`
            : ''
      );
      setPriority(task?.priority || 'medium');
      setTagsInput(task?.tags?.join(', ') || '');
      setDepartmentId(task?.departmentId || '__none__');
      setIsRecurring(task?.isRecurring ?? false);
      setRecurrenceType(task?.recurrenceType ?? '');
      setRecurrenceEndDate(task?.recurrenceEndDate ? task.recurrenceEndDate.substring(0, 10) : '');
      setError('');
    }
  }, [task, open, defaultDeadline, defaultScheduledAt]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setDeadline('');
    setScheduledAt('');
    setPriority('medium');
    setTagsInput('');
    setDepartmentId('__none__');
    setIsRecurring(false);
    setRecurrenceType('');
    setRecurrenceEndDate('');
    setError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (isRecurring) {
      if (!deadline) {
        setError('Deadline is required for recurring tasks');
        return;
      }
      if (!recurrenceType) {
        setError('Please select how often this task repeats');
        return;
      }
    }

    if (deadline && !task?._id) {
      const selected = new Date(deadline);
      if (isNaN(selected.getTime())) {
        setError('Invalid deadline');
        return;
      }
      if (selected < new Date()) {
        setError('Deadline cannot be in the past');
        return;
      }
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      priority,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      departmentId: departmentId === '__none__' ? undefined : departmentId || undefined,
      isRecurring,
      recurrenceType: isRecurring ? (recurrenceType as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY') : null,
      recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString() : null,
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
              <Label htmlFor="task-scheduled">Scheduled for</Label>
              <Input
                id="task-scheduled"
                type="datetime-local"
                step="60"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-deadline">Deadline <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="task-deadline"
                type="datetime-local"
                step="60"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-tags">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
            <Input
              id="task-tags"
              type="text"
              placeholder="bug, feature, etc."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {allMemberships.length > 0 && (
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="None (Personal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (Personal)</SelectItem>
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

          {/* Recurring task section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                id="task-recurring"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded accent-[#FE812C] cursor-pointer"
              />
              <Label htmlFor="task-recurring" className="cursor-pointer font-normal">
                Make this a recurring task
              </Label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-1.5">
                  <Label>Repeats</Label>
                  <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-recurrence-end">End date <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    id="task-recurrence-end"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {task?.createdAt && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Created at</Label>
              <p className="text-sm text-muted-foreground px-3 py-2 bg-muted/40 rounded-xl">
                {formatCreatedAt(task.createdAt)}
              </p>
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
