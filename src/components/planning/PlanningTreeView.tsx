import { useEffect, useCallback, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Loader2, Plus, ChevronsUpDown, RefreshCw, X, Check } from 'lucide-react';
import { usePlanningStore } from '@/store/planningStore';
import { useMilestoneStore } from '@/store/milestoneStore';
import MilestoneNode from './MilestoneNode';
import TaskNode from './TaskNode';
import type { PlanningTask, PlanningMilestone, PlanningSubtask, ProjectMember, Task } from '@/types';
import { planningService } from '@/services/planningService';
import { milestoneService } from '@/services/milestoneService';
import { subtaskService } from '@/services/subtaskService';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import TaskDialog from '@/components/TaskDialog';
import { useTaskStore } from '@/store/taskStore';
import { useSocketStore } from '@/store/socketStore';

interface Props {
  projectId: string;
  canManage: boolean;
  projectMembers?: ProjectMember[];
}

type ActiveDragItem =
  | { type: 'milestone'; item: PlanningMilestone }
  | { type: 'task'; item: PlanningTask; milestoneId: string }
  | { type: 'subtask'; item: PlanningSubtask; parentTaskId: string; milestoneId: string };

export default function PlanningTreeView({ projectId, canManage, projectMembers }: Props) {
  const {
    tree, loading, error, expandedMilestones, fetchTree, refresh,
    patchMilestones, expandAll, collapseAll,
  } = usePlanningStore();

  const milestoneStore = useMilestoneStore();
  const { updateTask } = useTaskStore();
  const { socket, connected, joinProject } = useSocketStore();

  const [activeDrag, setActiveDrag] = useState<ActiveDragItem | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [createForMilestone, setCreateForMilestone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNewMilestoneForm, setShowNewMilestoneForm] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  useEffect(() => {
    fetchTree(projectId);
    return () => usePlanningStore.getState().reset();
  }, [projectId]);

  // Real-time planning sync (D-09) — re-join on reconnect via `connected` dep
  useEffect(() => {
    if (!socket || !connected) return;
    socket.emit('join:project', projectId);
    const handler = () => { void usePlanningStore.getState().refresh(); };
    socket.on('planning:updated', handler);
    return () => { socket.off('planning:updated', handler); };
  }, [socket, connected, projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!tree) return;
    const { active } = event;
    const data = active.data.current as { type: string; milestoneId?: string; parentTaskId?: string } | undefined;

    if (data?.type === 'milestone') {
      const m = tree.milestones.find(m => m.id === active.id);
      if (m) setActiveDrag({ type: 'milestone', item: m });
    } else if (data?.type === 'task') {
      const milestoneId = data.milestoneId ?? '';
      const m = tree.milestones.find(m => m.id === milestoneId);
      const t = m?.tasks.find(t => t.id === active.id)
        ?? tree.unassigned.data.find(t => t.id === active.id);
      if (t) setActiveDrag({ type: 'task', item: t, milestoneId });
    } else if (data?.type === 'subtask') {
      const parentTaskId = data.parentTaskId ?? '';
      for (const m of tree.milestones) {
        const t = m.tasks.find(t => t.id === parentTaskId);
        if (t) {
          const s = t.subtasks.find(s => s.id === active.id);
          if (s) { setActiveDrag({ type: 'subtask', item: s, parentTaskId, milestoneId: m.id }); break; }
        }
      }
    }
  }, [tree]);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual-only — no state mutation on over
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over || !tree) return;

    const activeData = active.data.current as { type: string; milestoneId?: string; parentTaskId?: string } | undefined;
    const overData = over.data.current as { type: string; milestoneId?: string; taskId?: string } | undefined;

    // ── CASE 1: Milestone reorder ──
    if (activeData?.type === 'milestone' && overData?.type === 'milestone' && active.id !== over.id) {
      const oldIndex = tree.milestones.findIndex(m => m.id === active.id);
      const newIndex = tree.milestones.findIndex(m => m.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(tree.milestones, oldIndex, newIndex);
      patchMilestones(reordered);

      const items = reordered.map((m, idx) => ({ id: m.id, order: idx }));
      try {
        await milestoneService.reorderMilestones(projectId, items);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to reorder milestones'));
        await refresh();
      }
      return;
    }

    // ── CASE 2: Task reorder within same milestone ──
    if (activeData?.type === 'task' && overData?.type === 'task' && active.id !== over.id) {
      const srcMilestoneId = activeData.milestoneId!;
      const dstMilestoneId = overData.milestoneId!;

      if (srcMilestoneId === dstMilestoneId) {
        const mIdx = tree.milestones.findIndex(m => m.id === srcMilestoneId);
        if (mIdx === -1) return;

        const tasks = [...tree.milestones[mIdx]!.tasks];
        const oldIdx = tasks.findIndex(t => t.id === active.id);
        const newIdx = tasks.findIndex(t => t.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return;

        const reorderedTasks = arrayMove(tasks, oldIdx, newIdx);
        const newMilestones = tree.milestones.map((m, i) =>
          i === mIdx ? { ...m, tasks: reorderedTasks } : m
        );
        patchMilestones(newMilestones);

        try {
          await planningService.reorderMilestoneTasks(projectId, srcMilestoneId, reorderedTasks.map(t => t.id));
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Failed to reorder tasks'));
          await refresh();
        }
        return;
      }
    }

    // ── CASE 3: Task moved to a different milestone ──
    if (activeData?.type === 'task') {
      const srcMilestoneId = activeData.milestoneId ?? '';

      // Accept drops on: milestone header, expanded drop zone, or a task inside another milestone
      const targetMilestoneId =
        overData?.type === 'milestone-drop' ? overData.milestoneId! :
        overData?.type === 'milestone' ? (over.id as string) :
        (overData?.type === 'task' && overData.milestoneId && overData.milestoneId !== srcMilestoneId)
          ? overData.milestoneId
          : null;

      if (!targetMilestoneId) return;
      if (srcMilestoneId === targetMilestoneId) return;

      const dstIdx = tree.milestones.findIndex(m => m.id === targetMilestoneId);
      if (dstIdx === -1) return;

      // ── Unassigned → milestone ──
      if (srcMilestoneId === '') {
        const task = tree.unassigned.data.find(t => t.id === active.id);
        if (!task) return;

        const newTask = { ...task, milestoneId: targetMilestoneId };
        const newMilestones = tree.milestones.map((m, i) =>
          i === dstIdx ? { ...m, tasks: [...m.tasks, newTask] } : m
        );

        // Optimistic: move task out of unassigned, into milestone
        usePlanningStore.setState(state => ({
          tree: state.tree ? {
            ...state.tree,
            milestones: newMilestones,
            unassigned: {
              ...state.tree.unassigned,
              data: state.tree.unassigned.data.filter(t => t.id !== active.id),
              total: Math.max(0, state.tree.unassigned.total - 1),
            },
          } : null,
        }));

        try {
          await updateTask(task.id, { milestoneId: targetMilestoneId });
          await refresh();
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Failed to move task'));
          await refresh();
        }
        return;
      }

      // ── Milestone → different milestone ──
      const srcIdx = tree.milestones.findIndex(m => m.id === srcMilestoneId);
      if (srcIdx === -1) return;

      const task = tree.milestones[srcIdx]!.tasks.find(t => t.id === active.id);
      if (!task) return;

      const newTask = { ...task, milestoneId: targetMilestoneId };
      const newMilestones = tree.milestones.map((m, i) => {
        if (i === srcIdx) return { ...m, tasks: m.tasks.filter(t => t.id !== active.id) };
        if (i === dstIdx) return { ...m, tasks: [...m.tasks, newTask] };
        return m;
      });
      patchMilestones(newMilestones);

      try {
        await updateTask(task.id, { milestoneId: targetMilestoneId });
        await refresh();
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to move task'));
        await refresh();
      }
    }

    // ── CASE 4: Subtask moved to another task ──
    if (activeData?.type === 'subtask') {
      const subtaskId = active.id as string;
      const srcParentId = activeData.parentTaskId ?? '';

      const targetTaskId: string | null =
        overData?.type === 'subtask-drop' ? (overData.taskId ?? null) :
        overData?.type === 'task' ? (over.id as string) : null;

      if (!targetTaskId || targetTaskId === srcParentId) return;

      // Find subtask and source/dest milestones
      let foundSubtask: PlanningSubtask | null = null;
      let srcMilestoneId: string | null = null;
      for (const m of tree.milestones) {
        const t = m.tasks.find(t => t.id === srcParentId);
        if (t) {
          const s = t.subtasks.find(s => s.id === subtaskId);
          if (s) { foundSubtask = s; srcMilestoneId = m.id; break; }
        }
      }
      if (!foundSubtask || !srcMilestoneId) return;

      let dstMilestoneId: string | null = null;
      for (const m of tree.milestones) {
        if (m.tasks.find(t => t.id === targetTaskId)) { dstMilestoneId = m.id; break; }
      }
      if (!dstMilestoneId) return;

      // Optimistic update
      const capturedSubtask = foundSubtask;
      const newMilestones = tree.milestones.map(m => {
        // Same milestone: both tasks are in it
        if (m.id === srcMilestoneId && m.id === dstMilestoneId) {
          return {
            ...m,
            tasks: m.tasks.map(t => {
              if (t.id === srcParentId) {
                const newSubs = t.subtasks.filter(s => s.id !== subtaskId);
                return { ...t, subtasks: newSubs, subtaskProgress: { done: newSubs.filter(s => s.status === 'done').length, total: newSubs.length } };
              }
              if (t.id === targetTaskId) {
                const newSubs = [...t.subtasks, capturedSubtask];
                return { ...t, subtasks: newSubs, subtaskProgress: { done: newSubs.filter(s => s.status === 'done').length, total: newSubs.length } };
              }
              return t;
            }),
          };
        }
        if (m.id === srcMilestoneId) {
          return {
            ...m,
            tasks: m.tasks.map(t => {
              if (t.id !== srcParentId) return t;
              const newSubs = t.subtasks.filter(s => s.id !== subtaskId);
              return { ...t, subtasks: newSubs, subtaskProgress: { done: newSubs.filter(s => s.status === 'done').length, total: newSubs.length } };
            }),
          };
        }
        if (m.id === dstMilestoneId) {
          return {
            ...m,
            tasks: m.tasks.map(t => {
              if (t.id !== targetTaskId) return t;
              const newSubs = [...t.subtasks, capturedSubtask];
              return { ...t, subtasks: newSubs, subtaskProgress: { done: newSubs.filter(s => s.status === 'done').length, total: newSubs.length } };
            }),
          };
        }
        return m;
      });
      patchMilestones(newMilestones);

      try {
        await subtaskService.move(srcParentId, subtaskId, targetTaskId);
        void refresh();
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to move subtask'));
        await refresh();
      }
    }
  }, [tree, projectId, patchMilestones, refresh, updateTask]);

  const handleOpenTask = useCallback((taskId: string) => {
    if (!tree) return;
    let found: PlanningTask | null = null;
    for (const m of tree.milestones) {
      const t = m.tasks.find(t => t.id === taskId);
      if (t) { found = t; break; }
    }
    if (!found) {
      found = tree.unassigned.data.find(t => t.id === taskId) ?? null;
    }
    if (found) {
      setEditingTask({ ...found, _id: found.id } as unknown as Task);
    }
  }, [tree]);

  const handleAddTask = useCallback((milestoneId: string) => {
    setCreateForMilestone(milestoneId);
    setEditingTask({ _id: '__new__', title: '', description: '', status: 'todo', priority: 'medium', tags: [] } as unknown as Task);
  }, []);

  const handleCreateMilestone = useCallback(async () => {
    if (!newMilestoneTitle.trim() || creatingMilestone) return;
    setCreatingMilestone(true);
    try {
      await milestoneStore.create(projectId, { title: newMilestoneTitle.trim() });
      await refresh();
      setShowNewMilestoneForm(false);
      setNewMilestoneTitle('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create milestone'));
    } finally {
      setCreatingMilestone(false);
    }
  }, [newMilestoneTitle, creatingMilestone, milestoneStore, projectId, refresh]);

  const milestoneIds = tree?.milestones.map(m => m.id) ?? [];

  if (loading || !tree) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive text-sm">
        {error}
        <button onClick={() => fetchTree(projectId)} className="ml-2 underline hover:no-underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (expandedMilestones.size > 0) collapseAll(); else expandAll();
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronsUpDown size={12} />
            {expandedMilestones.size > 0 ? 'Collapse all' : 'Expand all'}
          </button>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {canManage && (
          <button
            onClick={() => { setShowNewMilestoneForm(true); setNewMilestoneTitle(''); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={12} />
            New Milestone
          </button>
        )}
      </div>

      {/* Inline new milestone form */}
      {canManage && showNewMilestoneForm && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary/30 bg-card animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <input
            autoFocus
            value={newMilestoneTitle}
            onChange={e => setNewMilestoneTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { void handleCreateMilestone(); }
              if (e.key === 'Escape') { setShowNewMilestoneForm(false); setNewMilestoneTitle(''); }
            }}
            placeholder="Milestone title..."
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={() => void handleCreateMilestone()}
            disabled={!newMilestoneTitle.trim() || creatingMilestone}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary disabled:opacity-40 transition-colors"
          >
            {creatingMilestone ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button
            onClick={() => { setShowNewMilestoneForm(false); setNewMilestoneTitle(''); }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={milestoneIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tree.milestones.map(milestone => (
              <MilestoneNode
                key={milestone.id}
                milestone={milestone}
                canManage={canManage}
                projectMembers={projectMembers}
                onOpenTask={handleOpenTask}
                onAddTask={handleAddTask}
                projectId={projectId}
              />
            ))}
          </div>
        </SortableContext>

        {/* Unassigned tasks section */}
        {tree.unassigned.data.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-muted/20">
              <span className="text-xs font-semibold text-muted-foreground">Unassigned Tasks</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {tree.unassigned.total}
              </span>
            </div>
            <div className="mt-1 ml-4 pl-3 border-l-2 border-dashed border-border/30 space-y-0.5">
              {tree.unassigned.data.map(task => (
                <TaskNode
                  key={task.id}
                  task={task}
                  milestoneId=""
                  canEdit={canManage}
                  projectMembers={projectMembers}
                  onOpenTask={handleOpenTask}
                  onToggleSubtask={async () => {}}
                />
              ))}
            </div>
          </div>
        )}

        {tree.milestones.length === 0 && tree.unassigned.data.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/50 text-sm">
            No milestones yet. Create one to start planning.
          </div>
        )}

        {/* DnD overlay */}
        <DragOverlay>
          {activeDrag?.type === 'task' && (
            <div className="bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-lg text-sm font-medium opacity-90">
              {activeDrag.item.title}
            </div>
          )}
          {activeDrag?.type === 'milestone' && (
            <div className="bg-card border border-primary/30 rounded-xl p-3 shadow-lg text-sm font-semibold opacity-90">
              {activeDrag.item.title}
            </div>
          )}
          {activeDrag?.type === 'subtask' && (
            <div className="bg-card border border-primary/30 rounded-lg px-2 py-1 shadow-lg text-xs font-medium opacity-90">
              {activeDrag.item.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task edit dialog */}
      {editingTask && (
        <TaskDialog
          open={!!editingTask}
          onClose={() => { setEditingTask(null); setCreateForMilestone(null); refresh(); }}
          task={editingTask._id === '__new__' ? null : editingTask}
          onSubmit={async (data) => {
            setSubmitting(true);
            try {
              if (editingTask._id === '__new__') {
                await useTaskStore.getState().createTask({
                  ...data,
                  milestoneId: data.milestoneId ?? createForMilestone ?? undefined,
                });
              } else {
                await useTaskStore.getState().updateTask(editingTask._id, data);
              }
              await refresh();
              setEditingTask(null);
              setCreateForMilestone(null);
            } finally {
              setSubmitting(false);
            }
          }}
          lockedProjectId={projectId}
          projectMembers={projectMembers}
          canAssign={canManage}
          loading={submitting}
          onSubtasksChanged={() => refresh()}
        />
      )}
    </div>
  );
}
