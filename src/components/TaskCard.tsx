import type { Task, ProjectMember, BoardColumn } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar, MessageSquare, Square, FolderOpen, Clock, CircleSlash, Repeat, UserCheck, User } from 'lucide-react';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import { DescriptionView } from '@/components/DescriptionEditor';

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
  onCancelRecurring?: (task: Task) => void;
  commentCount?: number;
  hideProjectLabel?: boolean;
  canEditTasks?: boolean;
  canDeleteTasks?: boolean;
  projectMembers?: ProjectMember[];
  boardColumns?: BoardColumn[];
}

export default function TaskCard({ task, onEdit, onDelete, onComment, onCancelRecurring, commentCount: commentCountProp, hideProjectLabel, canEditTasks = true, canDeleteTasks, projectMembers }: TaskCardProps) {
  const commentCount = commentCountProp ?? task._count?.comments ?? 0;
  const { activeSession, elapsedSeconds, stopTracking } = useTimeTrackingStore();
  const isTracking = activeSession?.taskId === task._id;
  const projects = useProjectStore((s) => s.projects);
  const currentUser = useAuthStore((s) => s.user);
  const projectName = task.projectId
    ? projects.find((p) => p.id === task.projectId)?.name
    : undefined;
  const currentUserId = currentUser?.id ?? currentUser?._id;
  const isAssignedToMe = task.assignedTo != null && task.assignedTo === currentUserId;
  const assignee = projectMembers?.find(m => m.profileId === task.assignedTo);
  const effectiveCanDelete = canDeleteTasks ?? canEditTasks;

  const handleStopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await stopTracking();
      toast.success('Timer stopped');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to stop timer'));
    }
  };

  const isParentRecurring = task.isRecurring && !task.recurrenceParentId;

  const shortId = '#' + task._id.replace(/-/g, '').slice(0, 8).toUpperCase();

  return (
    <div
      className={`bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
        isParentRecurring
          ? 'border-l-2 border-l-amber-400 border-border hover:border-l-amber-500'
          : 'border-border hover:border-primary/20'
      }`}
      onClick={() => onEdit(task)}
    >
      {/* Header: Task ID + Actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted/60 text-muted-foreground text-[10px] font-mono border border-border/40 shrink-0 select-none">
            {shortId}
          </span>
          {isParentRecurring && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-semibold border border-amber-500/20">
              <Repeat size={9} className="shrink-0" />
              Recurring
            </span>
          )}
          {isAssignedToMe && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-500 text-[10px] font-semibold border border-purple-500/20">
              <UserCheck size={9} className="shrink-0" />
              Assigned
            </span>
          )}
        </div>
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

          {task.isRecurring && !task.recurrenceParentId && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancelRecurring?.(task); }}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
              title="Cancel recurring"
            >
              <CircleSlash size={14} />
            </button>
          )}

          {canEditTasks && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          {effectiveCanDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-sm text-foreground mb-1.5 line-clamp-2">
        {task.title}
      </h4>

      {/* Project badge */}
      {projectName && !hideProjectLabel && (
        <div className="flex items-center mb-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-semibold max-w-full">
            <FolderOpen size={9} className="shrink-0" />
            <span className="truncate">{projectName}</span>
          </span>
        </div>
      )}

      {/* Assignee display (project mode) */}
      {projectMembers && task.assignedTo && (
        <div className="flex items-center gap-1.5 mb-2">
          {assignee?.profile?.avatar ? (
            <img src={assignee.profile.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
          ) : (
            <User size={10} className="text-muted-foreground shrink-0" />
          )}
          <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
            {assignee?.profile?.name ?? assignee?.profile?.email ?? 'Assigned'}
          </span>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div className="mb-3">
          <DescriptionView html={task.description} className="text-xs text-muted-foreground" />
        </div>
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

      {/* Subtask progress bar */}
      {task.subtaskProgress && task.subtaskProgress.total > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">Subtasks</span>
            <span className="text-[10px] text-muted-foreground">
              {task.subtaskProgress.completed}/{task.subtaskProgress.total}
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.round((task.subtaskProgress.completed / task.subtaskProgress.total) * 100)}%` }}
            />
          </div>
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <Clock size={11} className="shrink-0" />
            <span>{new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          {task.createdBy && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground/60 min-w-0">
              {task.createdBy.avatar ? (
                <img src={task.createdBy.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
              ) : (
                <User size={11} className="shrink-0" />
              )}
              <span className="truncate max-w-[80px]">
                {task.createdBy.name ?? task.createdBy.email ?? 'Unknown'}
              </span>
            </div>
          )}
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
