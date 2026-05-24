import { useState } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { taskService } from '@/services/taskService';
import { getApiErrorMessage } from '@/services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TimerStartButtonProps {
  fetchParams: { status: 'doing'; personal?: boolean; departmentId?: string; limit: number };
}

export default function TimerStartButton({ fetchParams }: TimerStartButtonProps) {
  const { activeSession, elapsedSeconds, loading, startTracking, stopTracking } = useTimeTrackingStore();
  const [fetching, setFetching] = useState(false);
  const isTracking = !!activeSession;

  const handleClick = async () => {
    if (isTracking) {
      try {
        await stopTracking();
        toast.success('Timer stopped');
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to stop timer'));
      }
      return;
    }

    setFetching(true);
    try {
      const res = await taskService.getTasks(fetchParams);
      const first = res.data.find(t => t.status === 'doing');
      if (!first) {
        toast.info('No tasks in progress. Move a task to "In Progress" first.');
        return;
      }
      await startTracking(first._id || first.id!);
      toast.success(`Timer started — ${first.title}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to start timer'));
    } finally {
      setFetching(false);
    }
  };

  const busy = loading || fetching;

  return (
    <Button
      onClick={handleClick}
      disabled={busy}
      variant="outline"
      className={cn(
        'rounded-xl gap-2 transition-all font-semibold min-w-[130px]',
        isTracking
          ? 'border-green-500/40 bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400'
          : 'border-border text-muted-foreground hover:text-foreground'
      )}
    >
      {busy ? (
        <Loader2 size={15} className="animate-spin shrink-0" />
      ) : isTracking ? (
        <Square size={15} className="shrink-0" />
      ) : (
        <Play size={15} className="shrink-0" />
      )}
      <span className="hidden sm:inline tabular-nums">
        {isTracking ? formatElapsed(elapsedSeconds) : 'Start Timer'}
      </span>
    </Button>
  );
}
