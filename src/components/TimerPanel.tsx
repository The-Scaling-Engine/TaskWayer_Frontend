import { useState, useEffect, useRef } from 'react';
import { Timer, Square, Loader2 } from 'lucide-react';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerPanel() {
  const { activeSession, elapsedSeconds, loading, stopTracking } = useTimeTrackingStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isTracking = !!activeSession;

  useEffect(() => {
    if (!isTracking) setOpen(false);
  }, [isTracking]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStop = async () => {
    try {
      await stopTracking();
      toast.success('Timer stopped');
      setOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to stop timer'));
    }
  };

  if (!isTracking) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-green-500"
        title={`Tracking: ${formatElapsed(elapsedSeconds)}`}
      >
        <Timer size={18} />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background animate-pulse" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 bg-green-500/5 border-b border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Now tracking</span>
              <span className="ml-auto text-xs font-mono font-bold text-green-600 dark:text-green-400 tabular-nums">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground truncate pl-4">
              {activeSession.task?.title ?? '—'}
            </p>
          </div>

          <div className="p-3">
            <button
              onClick={handleStop}
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors',
                'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white disabled:opacity-50'
              )}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
              Stop Timer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
