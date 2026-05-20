import type { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar, MessageSquare, Square, Building2, Clock } from 'lucide-react';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { useDepartmentStore } from '@/store/departmentStore';
import { toast } from 'sonner';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComment: (task: Task) => void;
  commentCount?: number;
}

const statusColors: Record<string, string> = {
  todo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  doing: 'bg-[#FE812C]/10 text-[#FE812C]',
  done: 'bg-primary/10 text-primary',
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  doing: 'In Progress',
  done: 'Done',
};

export default function TaskCard({ task, onEdit, onDelete, onComment, commentCount: commentCountProp }: TaskCardProps) {
  const commentCount = commentCountProp ?? task._count?.comments ?? 0;
  const { activeSession, elapsedSeconds, stopTracking } = useTimeTrackingStore();
  const isTracking = activeSession?.taskId === task._id;
  const allMemberships = useDepartmentStore((s) => s.allMemberships);
  const deptName = task.departmentId
    ? allMemberships.find((m) => m.department.id === task.departmentId)?.department.name
    : undefined;

  const handleStopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await stopTracking();
      toast.success('Timer stopped');
    } catch {
      toast.error('Failed to stop timer');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 group cursor-pointer">
      {/* Header: Status Badge + Actions */}
      <div className="flex items-start justify-between mb-3">
        <Badge variant="secondary" className={`${statusColors[task.status]} text-xs font-medium rounded-md`}>
          {statusLabels[task.status]}
        </Badge>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Comment icon with count */}
          <button
            onClick={(e) => { e.stopPropagation(); onComment(task); }}
            className="relative p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Comments"
          >
            <MessageSquare size={14} />
            {commentCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {commentCount > 99 ? '99+' : commentCount}
              </span>
            )}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm text-foreground mb-1.5 line-clamp-2">
        {task.title}
      </h4>

      {/* Department badge */}
      {deptName && (
        <div className="flex items-center mb-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FE812C]/10 text-[#FE812C] text-[10px] font-semibold max-w-full">
            <Building2 size={9} className="shrink-0" />
            <span className="truncate">{deptName}</span>
          </span>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority & Tags */}
      {(task.priority || (task.tags && task.tags.length > 0)) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {task.priority && (
            <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 border ${
              task.priority === 'high' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
              task.priority === 'medium' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
              'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
            }`}>
              {task.priority}
            </Badge>
          )}
          {task.tags?.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-[10px] font-medium bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 h-5 px-1.5">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          {task.deadline ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{new Date(task.deadline).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : <div />}

          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare size={11} />
              <span>{commentCount}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <Clock size={11} className="shrink-0" />
          <span>Created {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Floating timer – shown when this task is being tracked */}
      {isTracking && (
        <div className="flex justify-end mt-2">
          <button
            onClick={handleStopTimer}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-semibold hover:bg-destructive hover:text-white transition-colors animate-pulse"
          >
            <Square size={11} />
            {formatElapsed(elapsedSeconds)}
          </button>
        </div>
      )}
    </div>
  );
}
