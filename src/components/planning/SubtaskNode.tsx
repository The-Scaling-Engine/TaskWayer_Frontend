import { CheckSquare, Square, Clock } from 'lucide-react';
import type { PlanningSubtask } from '@/types';

interface Props {
  subtask: PlanningSubtask;
  onToggle: (subtask: PlanningSubtask) => void;
  canEdit: boolean;
}

export default function SubtaskNode({ subtask, onToggle, canEdit }: Props) {
  const isDone = subtask.status === 'done';

  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/40 group transition-colors">
      <button
        onClick={() => canEdit && onToggle(subtask)}
        disabled={!canEdit}
        className={`shrink-0 transition-colors ${isDone ? 'text-primary' : 'text-muted-foreground hover:text-primary'} ${!canEdit && 'cursor-default'}`}
      >
        {isDone ? <CheckSquare size={13} /> : <Square size={13} />}
      </button>

      <span className={`text-xs flex-1 min-w-0 truncate ${isDone ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
        {subtask.title}
      </span>

      {subtask.deadline && (
        <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
          <Clock size={9} />
          {new Date(subtask.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}
