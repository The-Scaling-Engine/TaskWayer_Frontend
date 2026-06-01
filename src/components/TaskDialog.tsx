/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { boardColumnService } from '@/services/boardColumnService';
import type { BoardColumn } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task, TaskNote, ProjectMember } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { UserCheck, Bold, Italic, List, Pencil, Trash2, Check, GripVertical } from 'lucide-react';
import DescriptionEditor from '@/components/DescriptionEditor';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { taskNoteService } from '@/services/taskNoteService';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Helpers ──────────────────────────────────────────────────

function toRecurrenceUnit(task?: { recurrenceType?: string | null } | null): 'DAILY' | 'WEEKLY' | 'MONTHLY' | '' {
  switch (task?.recurrenceType) {
    case 'DAILY':   return 'DAILY';
    case 'WEEKLY':  return 'WEEKLY';
    case 'BIWEEKLY': return 'WEEKLY';
    case 'MONTHLY': return 'MONTHLY';
    case 'QUARTERLY': return 'MONTHLY';
    case 'YEARLY':  return 'MONTHLY';
    default: return '';
  }
}

function toRecurrenceIntervalValue(task?: { recurrenceType?: string | null; recurrenceInterval?: number | null } | null): number {
  if (task?.recurrenceInterval && task.recurrenceInterval > 1) return task.recurrenceInterval;
  switch (task?.recurrenceType) {
    case 'BIWEEKLY':  return 2;
    case 'QUARTERLY': return 3;
    case 'YEARLY':    return 12;
    default: return 1;
  }
}

function toDatetimeLocal(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatCreatedAt(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatNoteTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isNoteEmpty(html: string): boolean {
  return !html.replace(/<[^>]*>/g, '').trim();
}

function wasEdited(note: TaskNote): boolean {
  return new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000;
}

// ─── NoteItem ─────────────────────────────────────────────────

interface NoteItemProps {
  note: TaskNote;
  currentUserEmail?: string;
  editingNoteId: string | null;
  confirmDeleteNoteId: string | null;
  deletingNoteIds: Set<string>;
  newNoteId: string | null;
  onToggleDone: (note: TaskNote) => void;
  onStartEdit: (note: TaskNote) => void;
  onRequestDelete: (noteId: string) => void;
  onConfirmDelete: (noteId: string) => void;
  onCancelDelete: () => void;
  dragHandle?: React.ReactNode;
  isDragging?: boolean;
}

function NoteItem({
  note,
  currentUserEmail,
  editingNoteId,
  confirmDeleteNoteId,
  deletingNoteIds,
  newNoteId,
  onToggleDone,
  onStartEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  dragHandle,
  isDragging,
}: NoteItemProps) {
  const isOwnNote = note.author.email === currentUserEmail;
  const isEditing  = editingNoteId === note.id;
  const isConfirming = confirmDeleteNoteId === note.id;
  const isDeleting = deletingNoteIds.has(note.id);
  const isNew  = newNoteId === note.id;
  const edited = wasEdited(note);

  return (
    <div
      className={cn(
        'group flex items-start gap-2 px-2 py-2.5 rounded-xl transition-all duration-200',
        'hover:bg-muted/40',
        isDeleting && 'opacity-0 -translate-y-1 scale-[0.98] pointer-events-none',
        note.done && !isDeleting && 'opacity-50',
        isNew && 'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isDragging && 'opacity-30',
      )}
    >
      {/* Drag handle */}
      {dragHandle}

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleDone(note)}
        className={cn(
          'shrink-0 mt-0.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center transition-colors',
          note.done ? 'bg-primary border-primary' : 'border-border hover:border-primary',
        )}
      >
        {note.done && <Check size={10} className="text-primary-foreground" strokeWidth={3} />}
      </button>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] text-muted-foreground font-medium truncate">
            {note.author.name ?? note.author.email.split('@')[0]}
          </span>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <span className="text-[11px] text-muted-foreground/70 shrink-0">
            {formatNoteTime(note.createdAt)}
            {edited && ' · edited'}
          </span>
        </div>

        {!isEditing && (
          <div
            className={cn(
              'text-sm prose prose-sm dark:prose-invert max-w-none',
              '[&_p]:my-0 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_p]:leading-snug',
              note.done && '[&_p]:line-through [&_li]:line-through [&_span]:line-through',
            )}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
          />
        )}

        {isOwnNote && !isEditing && (
          isConfirming ? (
            <div className="flex items-center gap-2 mt-1.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-150">
              <span className="text-xs text-muted-foreground">Delete this note?</span>
              <button type="button" onClick={onCancelDelete}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted">
                Keep
              </button>
              <button type="button" onClick={() => onConfirmDelete(note.id)}
                className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors px-1.5 py-0.5 rounded-md hover:bg-destructive/10">
                Yes, delete
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button type="button" onClick={() => onStartEdit(note)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Pencil size={10} /> Edit
              </button>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <button type="button" onClick={() => onRequestDelete(note.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 size={10} /> Delete
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── SortableNoteItem ─────────────────────────────────────────

function SortableNoteItem(props: NoteItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.note.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      className={cn(
        'rounded-xl',
        isDragging && 'z-50 shadow-lg bg-background border border-border/60 opacity-90',
      )}
    >
      <NoteItem
        {...props}
        dragHandle={
          <button
            {...listeners}
            type="button"
            tabIndex={-1}
            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-opacity touch-none"
          >
            <GripVertical size={14} />
          </button>
        }
      />
    </div>
  );
}

// ─── NoteToolbarBtn ───────────────────────────────────────────

function NoteToolbarBtn({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}

// ─── TaskDialogProps ──────────────────────────────────────────

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
    projectId?: string;
    columnId?: string | null;
    isRecurring?: boolean;
    recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
    recurrenceInterval?: number | null;
    recurrenceEndDate?: string | null;
    assignedTo?: string | null;
  }) => void;
  task?: Task | null;
  loading?: boolean;
  defaultDeadline?: string;
  defaultScheduledAt?: string;
  dialogTitle?: string;
  lockedProjectId?: string;
  lockedProjectName?: string;
  initialTab?: 'details' | 'notes';
  onCancelFromDate?: () => void;
  projectMembers?: ProjectMember[];
  canAssign?: boolean;
  isReadOnly?: boolean;
  externalError?: string;
}

// ─── TaskDialog ───────────────────────────────────────────────

export default function TaskDialog({
  open, onClose, onSubmit, task, loading,
  defaultDeadline, defaultScheduledAt,
  dialogTitle, lockedProjectId, lockedProjectName,
  initialTab, onCancelFromDate,
  projectMembers, canAssign = false, isReadOnly = false,
  externalError,
}: TaskDialogProps) {
  const projects = useProjectStore((s) => s.projects);
  const user = useAuthStore((s) => s.user);
  const myProfileId = user?.id ?? (user as { _id?: string })?._id;
  const myRole = projectMembers?.find(m => m.profileId === myProfileId)?.role;
  const canSelfAssignOnly = !canAssign && myRole === 'MEMBER';

  // MEMBER creating a new task in project mode: default assignee to self
  useEffect(() => {
    if (canSelfAssignOnly && !task?._id && myProfileId && assignedTo === null) {
      setAssignedTo(myProfileId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSelfAssignOnly, myProfileId, task?._id]);

  // ── Details tab state ──────────────────────────────────────
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<'todo' | 'doing' | 'done'>(task?.status || 'todo');
  const [deadline, setDeadline] = useState(task?.deadline ? toDatetimeLocal(task.deadline) : '');
  const [scheduledAt, setScheduledAt] = useState(task?.scheduledAt ? toDatetimeLocal(task.scheduledAt) : '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium');
  const [tagsInput, setTagsInput] = useState(task?.tags?.join(', ') || '');
  const [projectId, setProjectId] = useState(lockedProjectId || task?.projectId || '__none__');
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | ''>(() => toRecurrenceUnit(task));
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(() => toRecurrenceIntervalValue(task));
  const [confirmCancelFrom, setConfirmCancelFrom] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task?.recurrenceEndDate ? task.recurrenceEndDate.substring(0, 10) : '');
  const [columnId, setColumnId] = useState<string | null>(task?.columnId ?? null);
  const [projectColumns, setProjectColumns] = useState<BoardColumn[]>([]);
  const [assignedTo, setAssignedTo] = useState<string | null>(task?.assignedTo ?? null);
  const [error, setError] = useState('');

  // ── Update Notes tab state ─────────────────────────────────
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const prevTabRef = useRef<'details' | 'notes'>('details');
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);
  const [deletingNoteIds, setDeletingNoteIds] = useState<Set<string>>(new Set());
  const [newNoteId, setNewNoteId] = useState<string | null>(null);

  // ── Sorted notes: undone (by order) then done (by createdAt)
  const sortedNotes = useMemo(() => {
    const undone = notes.filter(n => !n.done).sort((a, b) => a.order - b.order);
    const done   = notes.filter(n =>  n.done).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return [...undone, ...done];
  }, [notes]);

  // ── DnD sensors ───────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── TipTap note editor ─────────────────────────────────────
  const noteEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write a note...' }),
    ],
    content: '',
    onUpdate: ({ editor }) => setNoteContent(editor.getHTML()),
  });

  // ── Sync form on open / task change ───────────────────────
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
      setProjectId(lockedProjectId || task?.projectId || '__none__');
      setIsRecurring(task?.isRecurring ?? false);
      setRecurrenceUnit(toRecurrenceUnit(task));
      setRecurrenceInterval(toRecurrenceIntervalValue(task));
      setRecurrenceEndDate(task?.recurrenceEndDate ? task.recurrenceEndDate.substring(0, 10) : '');
      setColumnId(task?.columnId ?? null);
      setAssignedTo(task?.assignedTo ?? null);
      setError('');
    }
  }, [task, open, defaultDeadline, defaultScheduledAt]);

  // Fetch columns for project context
  useEffect(() => {
    if (!open || !lockedProjectId) { setProjectColumns([]); return; }
    boardColumnService.getColumns(lockedProjectId)
      .then(res => {
        const cols = [...res.data].sort((a, b) => a.order - b.order);
        setProjectColumns(cols);
        // Auto-select default column if none is selected
        setColumnId(prev => {
          if (prev && cols.some(c => c.id === prev)) return prev;
          return cols.find(c => c.isDefault)?.id ?? (cols[0]?.id ?? null);
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lockedProjectId]);

  // Reset notes state on open/close
  useEffect(() => {
    if (open) {
      const tab = initialTab ?? 'details';
      setActiveTab(tab);
      prevTabRef.current = tab;
    }
    if (!open) {
      setActiveTab('details');
      prevTabRef.current = 'details';
      setNotes([]);
      setEditingNoteId(null);
      setConfirmDeleteNoteId(null);
      setDeletingNoteIds(new Set());
      setNewNoteId(null);
      setNoteContent('');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      noteEditor?.commands.clearContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTab]);

  // Load notes when Update Notes tab activated
  useEffect(() => {
    if (activeTab === 'notes' && task?._id && open) {
      setNotesLoading(true);
      taskNoteService.getNotes(task._id)
        .then(res => setNotes(res.data))
        .catch(() => {})
        .finally(() => setNotesLoading(false));
    }
  }, [activeTab, task?._id, open]);

  // Load editor content when entering edit mode
  useEffect(() => {
    if (editingNoteId && noteEditor) {
      const note = notes.find(n => n.id === editingNoteId);
      if (note) {
        noteEditor.commands.setContent(note.content);
        setNoteContent(note.content);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingNoteId]);

  // ── Tab switch ────────────────────────────────────────────
  const handleTabChange = (tab: 'details' | 'notes') => {
    prevTabRef.current = activeTab;
    setActiveTab(tab);
  };

  // ── Form reset ────────────────────────────────────────────
  const resetForm = () => {
    setTitle(''); setDescription(''); setStatus('todo');
    setDeadline(''); setScheduledAt(''); setPriority('medium');
    setTagsInput(''); setProjectId('__none__');
    setIsRecurring(false); setRecurrenceUnit(''); setRecurrenceInterval(1); setRecurrenceEndDate('');
    setColumnId(null); setProjectColumns([]);
    setAssignedTo(null);
    setError('');
  };

  // ── Details form submit ───────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!title.trim()) { setError('Title is required'); return; }
    if (isRecurring) {
      if (!recurrenceUnit) { setError('Please select how often this task repeats'); return; }
    }
    if (deadline && !task?._id) {
      const s = new Date(deadline);
      if (isNaN(s.getTime())) { setError('Invalid deadline'); return; }
      if (s < new Date()) { setError('Deadline cannot be in the past'); return; }
    }
    onSubmit({
      title: title.trim(), description,
      status: (status ?? 'todo') as 'todo' | 'doing' | 'done',
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      priority,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      projectId: projectId === '__none__' ? undefined : projectId || undefined,
      ...(lockedProjectId && { columnId: columnId ?? null }),
      isRecurring,
      recurrenceType: isRecurring ? (recurrenceUnit as 'DAILY' | 'WEEKLY' | 'MONTHLY') : null,
      recurrenceInterval: isRecurring && recurrenceInterval > 1 ? recurrenceInterval : null,
      recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(`${recurrenceEndDate}T23:59:59`).toISOString() : null,
      ...(lockedProjectId && { assignedTo }),
    });
  };

  // ── Note handlers ─────────────────────────────────────────
  const handleAddNote = async () => {
    if (!task?._id || isNoteEmpty(noteContent) || noteSubmitting) return;
    setNoteSubmitting(true);
    try {
      const res = await taskNoteService.addNote(task._id, noteContent);
      setNotes(prev => [...prev, res.data]);
      setNewNoteId(res.data.id);
      setTimeout(() => setNewNoteId(null), 400);
      noteEditor?.commands.clearContent();
      setNoteContent('');
    } catch { /* silent */ } finally { setNoteSubmitting(false); }
  };

  const handleSaveEdit = async () => {
    if (!task?._id || !editingNoteId || isNoteEmpty(noteContent) || noteSubmitting) return;
    setNoteSubmitting(true);
    try {
      const res = await taskNoteService.updateNote(task._id, editingNoteId, noteContent);
      setNotes(prev => prev.map(n => n.id === editingNoteId ? res.data : n));
      setEditingNoteId(null);
      noteEditor?.commands.clearContent();
      setNoteContent('');
    } catch { /* silent */ } finally { setNoteSubmitting(false); }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    noteEditor?.commands.clearContent();
    setNoteContent('');
  };

  const handleToggleDone = async (note: TaskNote) => {
    if (!task?._id) return;
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, done: !n.done } : n));
    try {
      const res = await taskNoteService.toggleDone(task._id, note.id);
      setNotes(prev => prev.map(n => n.id === note.id ? res.data : n));
    } catch {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n));
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (!task?._id) return;
    setConfirmDeleteNoteId(null);
    setDeletingNoteIds(prev => new Set([...prev, noteId]));
    setTimeout(async () => {
      try {
        await taskNoteService.deleteNote(task._id!, noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
        setDeletingNoteIds(prev => { const s = new Set(prev); s.delete(noteId); return s; });
        if (editingNoteId === noteId) {
          setEditingNoteId(null);
          noteEditor?.commands.clearContent();
          setNoteContent('');
        }
      } catch {
        setDeletingNoteIds(prev => { const s = new Set(prev); s.delete(noteId); return s; });
      }
    }, 220);
  };

  // ── DnD handlers ─────────────────────────────────────────
  const handleDragStart = () => {
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.style.overflow = '';
    const { active, over } = event;
    if (!over || active.id === over.id || !task?._id) return;

    const undone = notes.filter(n => !n.done).sort((a, b) => a.order - b.order);
    const oldIdx = undone.findIndex(n => n.id === active.id);
    const newIdx = undone.findIndex(n => n.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    // Update order field so sortedNotes memo stays stable after reorder
    const reordered = arrayMove(undone, oldIdx, newIdx).map((n, i) => ({ ...n, order: i }));
    const done = notes.filter(n => n.done);
    setNotes([...reordered, ...done]);

    taskNoteService.reorderNotes(task._id, reordered.map(n => n.id)).catch(() => {
      if (task._id) {
        taskNoteService.getNotes(task._id).then(res => setNotes(res.data)).catch(() => {});
      }
    });
  };

  // ── Tab slide direction ───────────────────────────────────
  const slideIn = activeTab === 'notes' ? 'slide-in-from-right-2' : 'slide-in-from-left-2';

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) { onClose(); resetForm(); }
      }}
    >
      <DialogContent className="sm:max-w-[640px] rounded-2xl max-h-[90vh] overflow-y-auto !p-6">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-3 flex-wrap">
            <DialogTitle className="text-xl font-bold flex-1">
              {dialogTitle ?? (task?._id ? 'Edit Task' : 'Create New Task')}
            </DialogTitle>
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                <UserCheck size={11} /> Assigned
              </span>
            )}
          </div>
        </DialogHeader>

        {/* ── Tab bar — only when editing an existing task ─── */}
        {task?._id && (
          <div className="flex border-b border-border -mt-1">
            <button
              type="button"
              onClick={() => handleTabChange('details')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === 'details'
                  ? 'border-[#FE812C] text-[#FE812C]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('notes')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5',
                activeTab === 'notes'
                  ? 'border-[#FE812C] text-[#FE812C]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Update Notes
              {notes.length > 0 && (
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none',
                  activeTab === 'notes'
                    ? 'bg-[#FE812C]/15 text-[#FE812C]'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {notes.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── Details tab ─────────────────────────────────── */}
        {(!task?._id || activeTab === 'details') && (
          <div
            key={`details-${task?._id ?? 'new'}`}
            className={cn(
              task?._id && 'animate-in fade-in-0 duration-200',
              task?._id && activeTab === 'details' && 'slide-in-from-left-2',
            )}
          >
            <form onSubmit={handleSubmit} className="space-y-5 mt-3">
              {(error || externalError) && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-3 py-2 text-sm">
                  {error || externalError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="task-title" className="font-medium">Title</Label>
                <Input
                  id="task-title"
                  placeholder="Enter task title..."
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(''); }}
                  className="rounded-xl"
                  autoFocus={!isReadOnly}
                  disabled={isReadOnly}
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                <div className="space-y-2">
                  <Label className="font-medium">Description</Label>
                  <DescriptionEditor
                    key={task?._id ?? (open ? 'new-open' : 'new-closed')}
                    value={description}
                    onChange={setDescription}
                    disabled={isReadOnly}
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-2.5 w-[160px] shrink-0">
                  <div className="space-y-1.5">
                    {lockedProjectId ? (
                      <>
                        <Label className="text-xs">Status</Label>
                        {projectColumns.length > 0 ? (
                          <Select
                            value={columnId ?? ''}
                            onValueChange={setColumnId}
                            disabled={isReadOnly}>
                            <SelectTrigger className="rounded-xl text-xs h-8 px-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {projectColumns.map(col => (
                                <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="h-8 rounded-xl bg-muted/50 border border-border animate-pulse" />
                        )}
                      </>
                    ) : (
                      <>
                        <Label className="text-xs">Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as 'todo' | 'doing' | 'done')} disabled={isReadOnly}>
                          <SelectTrigger className="rounded-xl text-xs h-8 px-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="doing">Doing</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')} disabled={isReadOnly}>
                      <SelectTrigger className="rounded-xl text-xs h-8 px-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {lockedProjectId && projectMembers && projectMembers.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Assignee</Label>
                      {canAssign ? (
                        <Select
                          value={assignedTo ?? '__none__'}
                          onValueChange={(v) => setAssignedTo(v === '__none__' ? null : v)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="rounded-xl text-xs h-8 px-2"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Unassigned</SelectItem>
                            {projectMembers.map(m => (
                              <SelectItem key={m.profileId} value={m.profileId}>
                                {m.profile?.name ?? m.profile?.email ?? m.profileId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : canSelfAssignOnly ? (
                        <div className="flex items-center h-8 px-2 rounded-xl border border-border bg-muted/30 text-xs text-foreground select-none truncate">
                          {(() => {
                            const m = projectMembers.find(x => x.profileId === myProfileId);
                            const name = m?.profile?.name ?? m?.profile?.email;
                            return name ? `${name} (me)` : 'Me';
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center h-8 px-2 rounded-xl border border-border bg-muted/50 text-xs text-muted-foreground select-none truncate">
                          {assignedTo
                            ? (projectMembers.find(m => m.profileId === assignedTo)?.profile?.name
                                ?? projectMembers.find(m => m.profileId === assignedTo)?.profile?.email
                                ?? 'Assigned')
                            : 'Unassigned'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {(() => {
                const showProject = lockedProjectId || projects.filter(p => !p.archivedAt && !p.deletedAt).length > 0;
                return showProject ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="task-tags" className="font-medium">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                      <Input id="task-tags" placeholder="bug, feature, etc." value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="rounded-xl" disabled={isReadOnly} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium">
                        {lockedProjectId ? 'Project' : <>Project <span className="text-muted-foreground font-normal">(optional)</span></>}
                      </Label>
                      {lockedProjectId ? (
                        <div className="flex items-center h-9 px-3 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed select-none truncate">
                          {lockedProjectName || lockedProjectId}
                        </div>
                      ) : (
                        <Select value={projectId} onValueChange={setProjectId} disabled={isReadOnly}>
                          <SelectTrigger className="rounded-xl"><SelectValue placeholder="None" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {projects.filter(p => !p.archivedAt && !p.deletedAt).map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="task-tags" className="font-medium">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                    <Input id="task-tags" placeholder="bug, feature, etc." value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="rounded-xl" disabled={isReadOnly} />
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="task-scheduled" className="font-medium">Scheduled for</Label>
                  <Input id="task-scheduled" type="datetime-local" step="60" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-xl" disabled={isReadOnly} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-deadline" className="font-medium">Deadline <span className="text-muted-foreground font-normal">(opt.)</span></Label>
                  {isRecurring ? (
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground italic">
                      Not applicable for recurring tasks
                    </div>
                  ) : (
                    <Input id="task-deadline" type="datetime-local" step="60" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-xl" disabled={isReadOnly} />
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="space-y-2.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      id="task-recurring"
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => {
                        setIsRecurring(e.target.checked);
                        if (e.target.checked) setDeadline('');
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const next = !isRecurring; setIsRecurring(next); if (next) setDeadline(''); } }}
                      className="w-4 h-4 rounded accent-[#FE812C] cursor-pointer"
                    />
                    <Label htmlFor="task-recurring" className="cursor-pointer font-normal">Make this a recurring task</Label>
                  </div>
                  {isRecurring && (
                    <div className="pl-6">
                      <div className="flex gap-3 items-start">
                        <div className="space-y-1.5 w-[72px] shrink-0">
                          <Label className="text-xs">Every</Label>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={recurrenceInterval}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              setRecurrenceInterval(isNaN(v) || v < 1 ? 1 : v > 365 ? 365 : v);
                            }}
                            className="rounded-xl h-9 text-center px-2"
                          />
                        </div>
                        <div className="space-y-1.5 w-[130px] shrink-0">
                          <Label className="text-xs">Unit</Label>
                          <Select value={recurrenceUnit} onValueChange={(v) => setRecurrenceUnit(v as 'DAILY' | 'WEEKLY' | 'MONTHLY')}>
                            <SelectTrigger className="rounded-xl !h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">{recurrenceInterval > 1 ? 'Days' : 'Day'}</SelectItem>
                              <SelectItem value="WEEKLY">{recurrenceInterval > 1 ? 'Weeks' : 'Week'}</SelectItem>
                              <SelectItem value="MONTHLY">{recurrenceInterval > 1 ? 'Months' : 'Month'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5 w-[185px] shrink-0 ml-1">
                          <Label htmlFor="task-recurrence-end" className="text-xs">End date <span className="text-muted-foreground font-normal">(opt.)</span></Label>
                          <Input id="task-recurrence-end" type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} className="rounded-xl h-9" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {task?.createdAt && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Created at</Label>
                  <p className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/40 rounded-xl">{formatCreatedAt(task.createdAt)}</p>
                </div>
              )}

              {isReadOnly && (
                <p className="text-xs text-muted-foreground text-center py-1 bg-muted/40 rounded-xl px-3">
                  This task was assigned to you. Contact your manager to make changes.
                </p>
              )}

              <DialogFooter className="pt-1 flex-col gap-2 sm:flex-row sm:items-center !-mx-6 !-mb-6">
                {onCancelFromDate && task?._id && task?.recurrenceParentId && (
                  <div className="flex-1 flex justify-start">
                    {confirmCancelFrom ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Cancel all future occurrences?</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmCancelFrom(false)} className="h-7 px-2 text-xs rounded-lg">Keep</Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => { setConfirmCancelFrom(false); onCancelFromDate(); }} className="h-7 px-2 text-xs rounded-lg">Yes, cancel</Button>
                      </div>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmCancelFrom(true)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl text-xs h-8 px-3">
                        Cancel from this date onwards
                      </Button>
                    )}
                  </div>
                )}
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
                  {isReadOnly ? 'Close' : 'Cancel'}
                </Button>
                {!isReadOnly && (
                  <Button type="submit" disabled={loading} className="rounded-xl bg-[#FE812C] hover:bg-[#e5732a] text-white">
                    {loading ? 'Saving...' : task?._id ? 'Update Task' : 'Create Task'}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </div>
        )}

        {/* ── Update Notes tab ─────────────────────────────── */}
        {task?._id && activeTab === 'notes' && (
          <div
            key="notes-content"
            className={cn('mt-3 space-y-3 animate-in fade-in-0 duration-200', slideIn)}
          >
            {/* Notes feed */}
            <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1 -mx-1 px-1">
              {notesLoading && (
                <p className="text-sm text-muted-foreground text-center py-8">Loading notes...</p>
              )}
              {!notesLoading && sortedNotes.length === 0 && (
                <div className="text-center py-10 space-y-1">
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                  <p className="text-xs text-muted-foreground/60">Add your first note below.</p>
                </div>
              )}

              {!notesLoading && sortedNotes.length > 0 && (() => {
                const undoneNotes = sortedNotes.filter(n => !n.done);
                const doneNotes   = sortedNotes.filter(n =>  n.done);
                const noteProps = {
                  currentUserEmail: user?.email,
                  editingNoteId,
                  confirmDeleteNoteId,
                  deletingNoteIds,
                  newNoteId,
                  onToggleDone: handleToggleDone,
                  onStartEdit: (n: TaskNote) => setEditingNoteId(n.id),
                  onRequestDelete: setConfirmDeleteNoteId,
                  onConfirmDelete: handleDeleteNote,
                  onCancelDelete: () => setConfirmDeleteNoteId(null),
                };
                return (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => { document.body.style.overflow = ''; }}
                  >
                    {/* Undone notes — sortable */}
                    <SortableContext items={undoneNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                      {undoneNotes.map(note => (
                        <SortableNoteItem key={note.id} note={note} {...noteProps} />
                      ))}
                    </SortableContext>

                    {/* Done notes — fixed at bottom */}
                    {doneNotes.length > 0 && (
                      <div className={cn('space-y-0.5', undoneNotes.length > 0 && 'mt-1.5 pt-1.5 border-t border-border/40')}>
                        {doneNotes.map(note => (
                          <NoteItem key={note.id} note={note} {...noteProps} />
                        ))}
                      </div>
                    )}
                  </DndContext>
                );
              })()}
            </div>

            {/* Editor area */}
            <div className="border-t border-border pt-3">
              {editingNoteId && (
                <p className="text-xs font-medium text-[#FE812C] mb-1.5 flex items-center gap-1">
                  <Pencil size={10} /> Editing note
                </p>
              )}
              <div className="border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FE812C]/20 transition-shadow">
                <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/30">
                  <NoteToolbarBtn active={noteEditor?.isActive('bold')} onClick={() => noteEditor?.chain().focus().toggleBold().run()} title="Bold"><Bold size={11} /></NoteToolbarBtn>
                  <NoteToolbarBtn active={noteEditor?.isActive('italic')} onClick={() => noteEditor?.chain().focus().toggleItalic().run()} title="Italic"><Italic size={11} /></NoteToolbarBtn>
                  <NoteToolbarBtn active={noteEditor?.isActive('bulletList')} onClick={() => noteEditor?.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={11} /></NoteToolbarBtn>
                </div>
                <EditorContent
                  editor={noteEditor}
                  className={cn(
                    'px-3 py-2 min-h-[64px] text-sm',
                    '[&_.ProseMirror]:outline-none',
                    '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                    '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
                    '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
                    '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
                    '[&_.ProseMirror_p]:my-0.5',
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                {editingNoteId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="rounded-xl h-8 px-3 text-xs">
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={editingNoteId ? handleSaveEdit : handleAddNote}
                  disabled={noteSubmitting || isNoteEmpty(noteContent)}
                  className="rounded-xl h-8 px-4 text-xs bg-[#FE812C] hover:bg-[#e5732a] text-white"
                >
                  {noteSubmitting ? 'Saving...' : editingNoteId ? 'Save Changes' : 'Add Note'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
