import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/store/taskStore';
import { useSocketStore } from '@/store/socketStore';
import { useAuthStore } from '@/store/authStore';
import { boardColumnService } from '@/services/boardColumnService';
import { projectService } from '@/services/projectService';
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import CommentDialog from '@/components/CommentDialog';
import type { Task, BoardColumn, ProjectMember } from '@/types';
import { Plus, Loader2, ArrowUpDown, MoreHorizontal, Palette, Trash2, GripVertical, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import { cn } from '@/lib/utils';

// ─── Static column definition (non-project mode) ──────────────

interface StaticColumn {
  id: 'todo' | 'doing' | 'done';
  title: string;
  color: string;
}

const STATIC_COLUMNS: StaticColumn[] = [
  { id: 'todo',  title: 'To Do',       color: 'bg-blue-500' },
  { id: 'doing', title: 'In Progress',  color: 'bg-[#FE812C]' },
  { id: 'done',  title: 'Done',         color: 'bg-primary' },
];

// ─── Submit data ───────────────────────────────────────────────

interface TaskSubmitData {
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  deadline?: string;
  scheduledAt?: string | null;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  departmentId?: string;
  projectId?: string;
  columnId?: string | null;
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  assignedTo?: string | null;
}


// ─── Sub-components ────────────────────────────────────────────

function DraggableTaskCard({
  task, isActiveDrag, onEdit, onDelete, onComment, onCancelRecurring, commentCount, hideDeptLabel, hideProjectLabel, canEditTasks, canDeleteTasks, projectMembers,
}: {
  task: Task; isActiveDrag: boolean;
  onEdit: (t: Task) => void; onDelete: (t: Task) => void;
  onComment: (t: Task) => void; onCancelRecurring: (t: Task) => void;
  commentCount?: number; hideDeptLabel?: boolean; hideProjectLabel?: boolean;
  canEditTasks?: boolean; canDeleteTasks?: boolean; projectMembers?: ProjectMember[];
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task._id,
    data: { type: 'task' },
  });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={isActiveDrag ? 'opacity-30' : undefined}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onComment={onComment}
        onCancelRecurring={onCancelRecurring} commentCount={commentCount}
        hideDeptLabel={hideDeptLabel} hideProjectLabel={hideProjectLabel}
        canEditTasks={canEditTasks} canDeleteTasks={canDeleteTasks} projectMembers={projectMembers} />
    </div>
  );
}

// Drop zone for task drops (static mode — keyed by status)
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}
      className={`space-y-2.5 min-h-[120px] rounded-xl p-2.5 transition-colors duration-150 ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset' : 'bg-muted/30'
      }`}>
      {children}
    </div>
  );
}

// Drop zone for task drops (project mode — keyed by columnId)
function ProjectTaskDropZone({ columnId, children }: { columnId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `task-drop-${columnId}`,
    data: { type: 'task-target', columnId },
  });
  return (
    <div ref={setNodeRef}
      className={`space-y-2.5 min-h-[120px] rounded-xl p-2.5 transition-colors duration-150 ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30 ring-inset' : 'bg-muted/30'
      }`}>
      {children}
    </div>
  );
}

// Sortable shell for column drag-to-reorder
function SortableColumnShell({
  col, isNew, children,
}: {
  col: BoardColumn;
  isNew?: boolean;
  children: (opts: { dragListeners: React.HTMLAttributes<Element> | undefined }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${col.id}`,
    data: { type: 'column', columnId: col.id },
  });
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      className={cn(
        'shrink-0 w-72',
        isDragging && 'opacity-40',
        isNew && 'animate-in fade-in-0 slide-in-from-right-4 duration-300',
      )}>
      {children({ dragListeners: listeners })}
    </div>
  );
}

// ─── Ref / Props ───────────────────────────────────────────────

export interface KanbanBoardRef {
  openCreateTask: () => void;
  openTaskById: (taskId: string, highlightCommentId?: string, openNotesTab?: boolean) => void;
}

interface KanbanBoardProps {
  hideDeptLabel?: boolean;
  hideProjectLabel?: boolean;
  filterFn?: (task: Task) => boolean;
  lockedDepartmentId?: string;
  lockedDepartmentName?: string;
  lockedProjectId?: string;
  lockedProjectName?: string;
  canEditTasks?: boolean;
  canDeleteTasks?: boolean;
  canAssign?: boolean;
}

// ─── Constants ────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
type SortOption = 'created' | 'priority' | 'dueDate';

// ─── KanbanBoard ───────────────────────────────────────────────

const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(({
  hideDeptLabel, hideProjectLabel, filterFn,
  lockedDepartmentId, lockedDepartmentName, lockedProjectId, lockedProjectName,
  canEditTasks = true, canDeleteTasks, canAssign = false,
}, ref) => {
  const { tasks, loading, createTask, updateTask, deleteTask, moveTask, moveTaskToColumn, cancelRecurrence, silentFetch } = useTaskStore();
  const { socket } = useSocketStore();
  const currentUser = useAuthStore((s) => s.user);
  const currentUserId = currentUser?.id ?? currentUser?._id;

  // ── Sort ────────────────────────────────────────────────────
  const sortStorageKey = `kanban-sort-${lockedProjectId ?? lockedDepartmentId ?? 'personal'}`;
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    (localStorage.getItem(sortStorageKey) as SortOption) ?? 'created'
  );
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    localStorage.setItem(sortStorageKey, value);
  };

  // ── Project members + filter state ─────────────────────────
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  // ── Dialog state ────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [cancelRecurringTask, setCancelRecurringTask] = useState<Task | null>(null);
  const [keepChildren, setKeepChildren] = useState(false);
  const [cancelRecurringLoading, setCancelRecurringLoading] = useState(false);
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | undefined>(undefined);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [openNotesOnNext, setOpenNotesOnNext] = useState(false);

  // ── DnD state ───────────────────────────────────────────────
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);

  // ── Dynamic columns (project mode) ─────────────────────────
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const addColumnInFlight = useRef(false);
  const [newColumnId, setNewColumnId] = useState<string | null>(null);

  // ── Sensors ─────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Socket ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = () => { void silentFetch(); };
    socket.on('task:statusUpdated', handler);
    return () => { socket.off('task:statusUpdated', handler); };
  }, [socket, silentFetch]);

  // ── Fetch project members ────────────────────────────────────
  useEffect(() => {
    if (!lockedProjectId) {
      setProjectMembers([]);
      setFilterSearch('');
      setFilterAssignee(null);
      return;
    }
    projectService.getMembers(lockedProjectId)
      .then(res => setProjectMembers(res.data))
      .catch(() => {});
    setFilterSearch('');
    setFilterAssignee(null);
  }, [lockedProjectId]);

  // ── Fetch columns ────────────────────────────────────────────
  useEffect(() => {
    if (!lockedProjectId) return;
    setColumnsLoading(true);
    boardColumnService.getColumns(lockedProjectId)
      .then(res => setBoardColumns([...res.data].sort((a, b) => a.order - b.order)))
      .catch(() => toast.error('Failed to load columns'))
      .finally(() => setColumnsLoading(false));
  }, [lockedProjectId]);

  // ── Close column menu on outside click ───────────────────────
  useEffect(() => {
    if (!openMenuId) return;
    const handleClose = () => setOpenMenuId(null);
    document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, [openMenuId]);

  // ── Imperative handle ────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    openCreateTask: () => handleCreate(),
    openTaskById: (taskId: string, hcId?: string, openNotesTab?: boolean) => {
      const task = tasks.find((t) => t.id === taskId || t._id === taskId);
      if (!task) return;
      if (hcId) {
        setHighlightCommentId(hcId);
        setCommentTask(task);
      } else {
        if (openNotesTab) setOpenNotesOnNext(true);
        handleEdit(task);
      }
    },
  }));

  // ── Sort helper ──────────────────────────────────────────────
  const sortTasks = (filtered: Task[]) =>
    [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const pa = PRIORITY_ORDER[a.priority ?? ''] ?? 3;
        const pb = PRIORITY_ORDER[b.priority ?? ''] ?? 3;
        if (pa !== pb) return pa - pb;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'dueDate') {
        const hasA = !!a.deadline, hasB = !!b.deadline;
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        if (hasA && hasB) return new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime();
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : new Date(a.createdAt).getTime();
      const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : new Date(b.createdAt).getTime();
      return aTime - bTime;
    });

  const applyFilters = (task: Task): boolean => {
    if (filterSearch && !task.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    if (filterAssignee) {
      if (filterAssignee === 'me') {
        if (task.assignedTo !== currentUserId) return false;
      } else if (filterAssignee === 'unassigned') {
        if (task.assignedTo) return false;
      } else {
        if (task.assignedTo !== filterAssignee) return false;
      }
    }
    return true;
  };

  const getTasksByStatus = (status: string) =>
    sortTasks(tasks.filter((t) => t.status === status && (!filterFn || filterFn(t)) && applyFilters(t)));

  const getTasksByColumn = (col: BoardColumn) =>
    sortTasks(tasks.filter((t) => {
      if (filterFn && !filterFn(t)) return false;
      if (!applyFilters(t)) return false;
      return col.isDefault ? (!t.columnId || t.columnId === col.id) : t.columnId === col.id;
    }));

  // ── Drag handlers ────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as Record<string, unknown> | undefined;
    if (data?.type === 'column') {
      setActiveColumn(boardColumns.find(c => c.id === data.columnId) ?? null);
      setActiveTask(null);
    } else {
      setActiveTask(tasks.find((t) => t._id === event.active.id) ?? null);
      setActiveColumn(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as Record<string, unknown> | undefined;

    // Column reorder
    if (activeData?.type === 'column') {
      const overData = over.data.current as Record<string, unknown> | undefined;
      const fromId = activeData.columnId as string;
      const toId = overData?.columnId as string | undefined;
      if (!fromId || !toId || fromId === toId || !lockedProjectId) return;
      const oldIds = boardColumns.map(c => c.id);
      const newIds = arrayMove(oldIds, oldIds.indexOf(fromId), oldIds.indexOf(toId));
      setBoardColumns(prev => {
        const map = new Map(prev.map(c => [c.id, c]));
        return newIds.map((id, i) => ({ ...map.get(id)!, order: i }));
      });
      void boardColumnService.reorderColumns(lockedProjectId, newIds).catch(() => {
        setBoardColumns(prev => [...prev].sort((a, b) => a.order - b.order));
        toast.error('Failed to reorder columns');
      });
      return;
    }

    // Task move
    const taskId = active.id as string;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    if (lockedProjectId) {
      const overId = over.id as string;
      if (!overId.startsWith('task-drop-')) return;
      const newColumnId = overId.replace('task-drop-', '');
      if (task.columnId === newColumnId) return;
      try { await moveTaskToColumn(taskId, newColumnId); }
      catch (err) { toast.error(getApiErrorMessage(err, 'Failed to move task')); }
    } else {
      const newStatus = over.id as 'todo' | 'doing' | 'done';
      if (task.status === newStatus) return;
      try { await moveTask(taskId, newStatus); }
      catch (err) { toast.error(getApiErrorMessage(err, 'Failed to move task')); }
    }
  };

  // ── Task create/edit handlers ────────────────────────────────
  const handleCreate = (opts?: { status?: 'todo' | 'doing' | 'done'; columnId?: string }) => {
    setEditingTask(null);
    if (opts?.status || opts?.columnId) {
      setEditingTask({
        _id: '', title: '', description: '',
        status: opts.status ?? 'todo',
        columnId: opts.columnId ?? null,
        userId: '', createdAt: '', updatedAt: '',
      } as Task);
    }
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => { setEditingTask(task); setDialogOpen(true); };
  const handleDelete = (task: Task) => setDeleteConfirm(task);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTask(deleteConfirm._id);
      toast.success('Task deleted successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete task'));
    }
    setDeleteConfirm(null);
  };

  const confirmCancelRecurring = async () => {
    if (!cancelRecurringTask) return;
    setCancelRecurringLoading(true);
    try {
      const message = await cancelRecurrence(cancelRecurringTask._id, keepChildren);
      toast.success(message);
      setCancelRecurringTask(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to cancel recurring task'));
    } finally { setCancelRecurringLoading(false); }
  };

  const handleSubmit = async (data: TaskSubmitData) => {
    setDialogLoading(true);
    try {
      if (editingTask && editingTask._id) {
        await updateTask(editingTask._id, data);
        toast.success('Task updated successfully');
      } else {
        await createTask({ ...data, ...(data.columnId != null && { columnId: data.columnId }) });
        toast.success('Task created successfully');
      }
      setDialogOpen(false);
      setEditingTask(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, editingTask?._id ? 'Failed to update task' : 'Failed to create task'));
    } finally { setDialogLoading(false); }
  };

  // ── Column management handlers ────────────────────────────────
  const handleAddColumn = async () => {
    const name = newColumnName.trim();
    if (!lockedProjectId || !name || addColumnInFlight.current) return;
    addColumnInFlight.current = true;

    // Optimistic: close input + show column immediately
    const tempId = `temp-${Date.now()}`;
    const tempColumn: BoardColumn = {
      id: tempId,
      projectId: lockedProjectId,
      name,
      color: '#94a3b8',
      order: (boardColumns[boardColumns.length - 1]?.order ?? -1) + 1,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setNewColumnName('');
    setAddingColumn(false);
    setBoardColumns(prev => [...prev, tempColumn]);
    setNewColumnId(tempId);
    setTimeout(() => setNewColumnId(null), 400);

    try {
      const res = await boardColumnService.createColumn(lockedProjectId, { name });
      // Swap temp column with real one (same position, real ID)
      setBoardColumns(prev => prev.map(c => c.id === tempId ? res.data : c));
    } catch (err) {
      // Rollback: remove temp column + reopen input
      setBoardColumns(prev => prev.filter(c => c.id !== tempId));
      setAddingColumn(true);
      setNewColumnName(name);
      toast.error(getApiErrorMessage(err, 'Failed to create column'));
    } finally {
      addColumnInFlight.current = false;
    }
  };

  const handleRenameColumn = async (columnId: string) => {
    if (!lockedProjectId || !renameValue.trim()) { setRenamingColumnId(null); return; }
    const original = boardColumns.find(c => c.id === columnId)?.name;
    if (renameValue.trim() === original) { setRenamingColumnId(null); return; }
    try {
      const res = await boardColumnService.updateColumn(lockedProjectId, columnId, { name: renameValue.trim() });
      setBoardColumns(prev => prev.map(c => c.id === columnId ? res.data : c));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to rename column'));
    }
    setRenamingColumnId(null);
  };

  const handleColumnColorChange = async (columnId: string, color: string) => {
    if (!lockedProjectId) return;
    setBoardColumns(prev => prev.map(c => c.id === columnId ? { ...c, color } : c));
    try {
      await boardColumnService.updateColumn(lockedProjectId, columnId, { color });
    } catch {
      toast.error('Failed to save color');
      boardColumnService.getColumns(lockedProjectId)
        .then(res => setBoardColumns([...res.data].sort((a, b) => a.order - b.order)))
        .catch(() => {});
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!lockedProjectId) return;
    try {
      await boardColumnService.deleteColumn(lockedProjectId, columnId);
      setBoardColumns(prev => prev.filter(c => c.id !== columnId));
      toast.success('Column deleted. Tasks moved to default column.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete column'));
    }
  };

  // ── Render helpers ────────────────────────────────────────────
  const renderTaskCards = (colTasks: Task[]) =>
    colTasks.map((task) => (
      <DraggableTaskCard key={task._id} task={task}
        isActiveDrag={activeTask?._id === task._id}
        onEdit={handleEdit} onDelete={handleDelete}
        onComment={(t) => setCommentTask(t)}
        onCancelRecurring={(t) => { setKeepChildren(false); setCancelRecurringTask(t); }}
        commentCount={commentCounts[task._id]}
        hideDeptLabel={hideDeptLabel} hideProjectLabel={hideProjectLabel}
        canEditTasks={canEditTasks} canDeleteTasks={canDeleteTasks}
        projectMembers={lockedProjectId ? projectMembers : undefined} />
    ));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* Toolbar: filter bar (project mode) + sort control */}
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          {lockedProjectId ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[160px] max-w-[240px]">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-muted/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50 border border-border"
                />
              </div>
              <select
                value={filterAssignee ?? ''}
                onChange={(e) => setFilterAssignee(e.target.value || null)}
                className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">All assignees</option>
                <option value="me">Assigned to me</option>
                <option value="unassigned">Unassigned</option>
                {projectMembers.map(m => (
                  <option key={m.profileId} value={m.profileId}>
                    {m.profile?.name ?? m.profile?.email ?? m.profileId}
                  </option>
                ))}
              </select>
              {(filterSearch || filterAssignee) && (
                <button
                  onClick={() => { setFilterSearch(''); setFilterAssignee(null); }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors border border-border"
                >
                  Clear
                </button>
              )}
            </div>
          ) : <div />}

          <div className="flex items-center gap-2">
            <ArrowUpDown size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Sort by</span>
            <select value={sortBy} onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
              <option value="created">Created</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
            </select>
          </div>
        </div>

        {/* ── Project mode: dynamic columns ── */}
        {lockedProjectId ? (
          columnsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : (
            <SortableContext
              items={boardColumns.map(c => `col-${c.id}`)}
              strategy={horizontalListSortingStrategy}>
              <div className="flex gap-5 overflow-x-auto pb-4 min-h-[200px]">
                {boardColumns.map(col => {
                  const colTasks = getTasksByColumn(col);
                  const isRenaming = renamingColumnId === col.id;
                  const isMenuOpen = openMenuId === col.id;

                  return (
                    <SortableColumnShell key={col.id} col={col} isNew={col.id === newColumnId}>
                      {({ dragListeners }) => (
                        <div className="group space-y-3 w-full">
                          {/* Column Header */}
                          <div className="flex items-center gap-1.5">
                            {/* Drag handle */}
                            <button
                              {...dragListeners}
                              type="button"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
                            >
                              <GripVertical size={14} />
                            </button>

                            {/* Color dot */}
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />

                            {/* Name or rename input */}
                            {isRenaming ? (
                              <input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => { void handleRenameColumn(col.id); }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { void handleRenameColumn(col.id); }
                                  if (e.key === 'Escape') { setRenamingColumnId(null); }
                                }}
                                className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-primary outline-none"
                              />
                            ) : (
                              <h3
                                className="flex-1 min-w-0 font-semibold text-foreground text-sm truncate cursor-default select-none"
                                onDoubleClick={() => { setRenamingColumnId(col.id); setRenameValue(col.name); }}
                                title="Double-click to rename"
                              >
                                {col.name}
                              </h3>
                            )}

                            {/* Task count */}
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium shrink-0">
                              {colTasks.length}
                            </span>

                            {/* Add task */}
                            {canEditTasks && (
                              <button
                                onClick={() => handleCreate({ columnId: col.id })}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                title={`Add task to ${col.name}`}>
                                <Plus size={15} />
                              </button>
                            )}

                            {/* Column menu */}
                            <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setOpenMenuId(isMenuOpen ? null : col.id)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-7 z-50 bg-popover border border-border rounded-xl shadow-lg p-1 min-w-[160px]">
                                  {/* Rename */}
                                  <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setRenamingColumnId(col.id);
                                      setRenameValue(col.name);
                                    }}
                                    className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-muted text-foreground">
                                    Rename
                                  </button>

                                  {/* Color picker */}
                                  <div
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-muted text-foreground cursor-pointer">
                                    <Palette size={13} className="text-muted-foreground" />
                                    <span>Color</span>
                                    <input
                                      type="color"
                                      defaultValue={col.color}
                                      onChange={(e) => {
                                        setBoardColumns(prev => prev.map(c => c.id === col.id ? { ...c, color: e.target.value } : c));
                                      }}
                                      onBlur={(e) => { void handleColumnColorChange(col.id, e.target.value); }}
                                      className="ml-auto w-8 h-6 cursor-pointer rounded border-0 p-0"
                                    />
                                  </div>

                                  {/* Delete (not for default column) */}
                                  {!col.isDefault && (
                                    <button
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        void handleDeleteColumn(col.id);
                                      }}
                                      className="w-full flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive">
                                      <Trash2 size={13} /> Delete column
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Column Body */}
                          <ProjectTaskDropZone columnId={col.id}>
                            {colTasks.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <p className="text-xs">No tasks yet</p>
                              </div>
                            ) : renderTaskCards(colTasks)}
                          </ProjectTaskDropZone>
                        </div>
                      )}
                    </SortableColumnShell>
                  );
                })}

                {/* Add column button */}
                {canEditTasks && <div className="shrink-0 w-64">
                  {addingColumn ? (
                    <div className="bg-muted/30 rounded-2xl p-3 space-y-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
                      <input
                        autoFocus
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { void handleAddColumn(); }
                          if (e.key === 'Escape') { setAddingColumn(false); setNewColumnName(''); }
                        }}
                        placeholder="Column name..."
                        className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => void handleAddColumn()}
                          className="text-xs px-3 py-1.5 rounded-xl bg-[#FE812C] text-white hover:bg-[#e5732a] transition-colors">
                          Add
                        </button>
                        <button onClick={() => { setAddingColumn(false); setNewColumnName(''); }}
                          className="text-xs px-3 py-1.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingColumn(true)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-2xl px-4 py-3 w-full transition-colors border-2 border-dashed border-border/50 hover:border-border">
                      <Plus size={15} />
                      Add column
                    </button>
                  )}
                </div>}
              </div>
            </SortableContext>
          )
        ) : (
          /* ── Static mode: 3-column status board ── */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STATIC_COLUMNS.map((col) => {
              const colTasks = getTasksByStatus(col.id);
              return (
                <div key={col.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h3 className="font-semibold text-foreground text-sm">{col.title}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                        {colTasks.length}
                      </span>
                    </div>
                    {canEditTasks && (
                      <button onClick={() => handleCreate({ status: col.id })}
                        className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={`Add task to ${col.title}`}>
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                  <DroppableColumn id={col.id}>
                    {colTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <p className="text-xs">No tasks yet</p>
                      </div>
                    ) : renderTaskCards(colTasks)}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-2 opacity-90 shadow-2xl">
              <TaskCard task={activeTask} onEdit={handleEdit} onDelete={handleDelete}
                onComment={(t) => setCommentTask(t)}
                commentCount={commentCounts[activeTask._id]}
                hideDeptLabel={hideDeptLabel} hideProjectLabel={hideProjectLabel}
                canEditTasks={canEditTasks} />
            </div>
          ) : activeColumn ? (
            <div className="opacity-90 shadow-2xl bg-card border border-border/60 rounded-2xl p-3 w-72">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColumn.color }} />
                <span className="font-semibold text-sm text-foreground">{activeColumn.name}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create/Edit Dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTask(null); setOpenNotesOnNext(false); }}
        onSubmit={handleSubmit}
        task={editingTask}
        loading={dialogLoading}
        lockedDepartmentId={editingTask?._id ? undefined : lockedDepartmentId}
        lockedDepartmentName={editingTask?._id ? undefined : lockedDepartmentName}
        lockedProjectId={lockedProjectId}
        lockedProjectName={lockedProjectName}
        initialTab={openNotesOnNext ? 'notes' : undefined}
        isReadOnly={!canEditTasks}
        projectMembers={lockedProjectId ? projectMembers : undefined}
        canAssign={canAssign}
      />

      {/* Comment Dialog */}
      {commentTask && (
        <CommentDialog open={!!commentTask}
          onClose={() => { setCommentTask(null); setHighlightCommentId(undefined); }}
          task={commentTask}
          onCountUpdate={(taskId, count) =>
            setCommentCounts((prev) => ({ ...prev, [taskId]: count }))
          }
          highlightCommentId={highlightCommentId} />
      )}

      {/* Cancel Recurring Dialog */}
      {cancelRecurringTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Cancel Recurring Task</h3>
            <p className="text-sm text-muted-foreground">
              What would you like to do with the existing copies of "{cancelRecurringTask.title}"?
            </p>
            <div className="space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="keepChildren" checked={!keepChildren}
                  onChange={() => setKeepChildren(false)} className="mt-0.5 accent-[#FE812C]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Delete unstarted copies</p>
                  <p className="text-xs text-muted-foreground">Remove all "To Do" copies. Keep "In Progress" and "Done" copies.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="radio" name="keepChildren" checked={keepChildren}
                  onChange={() => setKeepChildren(true)} className="mt-0.5 accent-[#FE812C]" />
                <div>
                  <p className="text-sm font-medium text-foreground">Keep all existing copies</p>
                  <p className="text-xs text-muted-foreground">Only stop generating new copies. All existing copies remain.</p>
                </div>
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCancelRecurringTask(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => void confirmCancelRecurring()} disabled={cancelRecurringLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                {cancelRecurringLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete Task</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => void confirmDelete()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default KanbanBoard;
