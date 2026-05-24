import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Square, Loader2, Clock } from 'lucide-react';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { taskService } from '@/services/taskService';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerPanel() {
  const { activeSession, elapsedSeconds, loading, startTracking, stopTracking } = useTimeTrackingStore();
  const [open, setOpen] = useState(false);
  const [doingTasks, setDoingTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchDoingTasks = useCallback(async () => {
    setFetching(true);
    try {
      const res = await taskService.getTasks({ status: 'doing', limit: 50 });
      if (res.success) setDoingTasks(res.data);
    } catch {
      // silent
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchDoingTasks();
  }, [open, fetchDoingTasks]);

  const handleStart = async (taskId: string) => {
    try {
      await startTracking(taskId);
      toast.success('Timer started');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to start timer'));
    }
  };

  const handleStop = async () => {
    try {
      await stopTracking();
      toast.success('Timer stopped');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to stop timer'));
    }
  };

  const isTracking = !!activeSession;
  const activeTask = doingTasks.find(t => (t._id || t.id) === activeSession?.taskId);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors',
          isTracking ? 'text-green-500' : 'text-foreground'
        )}
        title={isTracking ? `Tracking: ${formatElapsed(elapsedSeconds)}` : 'Time Tracker'}
      >
        <Timer size={18} />
        {isTracking && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Time Tracker</span>
            </div>
            {isTracking && (
              <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400">
                {formatElapsed(elapsedSeconds)}
              </span>
            )}
          </div>

          {/* Active session */}
          {isTracking && (
            <div className="px-4 py-3 bg-green-500/5 border-b border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">Now tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground flex-1 truncate">
                  {activeTask?.title ?? '—'}
                </p>
                <button
                  onClick={handleStop}
                  disabled={loading}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={11} className="animate-spin" /> : <Square size={11} />}
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Doing tasks list */}
          <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
            {fetching ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-muted-foreground" />
              </div>
            ) : doingTasks.length === 0 ? (
              <div className="px-4 py-8 text-center space-y-1.5">
                <p className="text-sm font-semibold text-foreground">No tasks in progress</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Update a task status to "In Progress" and try again.
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 pt-3 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">In Progress</p>
                </div>
                {doingTasks.map(task => {
                  const tid = task._id || task.id;
                  const isThis = activeSession?.taskId === tid;
                  return (
                    <div
                      key={tid}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors',
                        isThis && 'bg-green-500/5'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{task.title}</p>
                        {task.deadline && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            📅 {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      {isThis ? (
                        <button
                          onClick={handleStop}
                          disabled={loading}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Square size={11} />
                          Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStart(tid!)}
                          disabled={loading}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Play size={11} />
                          Start
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
