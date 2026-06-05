import { CheckSquare, Square, Clock, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { PlanningSubtask } from '@/types';

interface Props {
  subtask: PlanningSubtask;
  parentTaskId: string;
  onToggle: (subtask: PlanningSubtask) => void;
  canEdit: boolean;
}

export default function SubtaskNode({ subtask, parentTaskId, onToggle, canEdit }: Props) {
  const isDone = subtask.status === 'done';

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: subtask.id,
    data: { type: 'subtask', parentTaskId },
    disabled: !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-muted/40 group/subtask transition-colors ${isDragging ? 'opacity-40' : ''}`}
    >
      <span className="shrink-0 text-muted-foreground/30 text-[10px] select-none">└</span>

      {canEdit && (
        <button
          {...attributes} {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground opacity-40 group-hover/subtask:opacity-100 transition-opacity touch-none"
          aria-label="Drag to reorder subtask"
        >
          <GripVertical size={11} />
        </button>
      )}

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
