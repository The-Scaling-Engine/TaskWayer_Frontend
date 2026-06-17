import { create } from 'zustand';
import { planningService } from '@/services/planningService';
import { getApiErrorMessage } from '@/services/api';
import type { PlanningTree, PlanningMilestone } from '@/types';

interface PlanningState {
  tree: PlanningTree | null;
  loading: boolean;
  error: string | null;
  projectId: string | null;
  expandedMilestones: Set<string>;
  expandedTasks: Set<string>;

  fetchTree: (projectId: string) => Promise<void>;
  refresh: () => Promise<void>;
  toggleMilestone: (id: string) => void;
  toggleTask: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  patchMilestones: (milestones: PlanningMilestone[]) => void;
  reset: () => void;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  tree: null,
  loading: false,
  error: null,
  projectId: null,
  expandedMilestones: new Set(),
  expandedTasks: new Set(),

  fetchTree: async (projectId: string) => {
    set({ loading: true, error: null, projectId });
    try {
      const tree = await planningService.getTree(projectId);
      const expandedMilestones = new Set(tree.milestones.map(m => m.id));
      set({ tree, loading: false, expandedMilestones });
    } catch (err) {
      set({ error: getApiErrorMessage(err, 'Failed to load planning tree'), loading: false });
    }
  },

  refresh: async () => {
    const { projectId } = get();
    if (!projectId) return;
    try {
      const tree = await planningService.getTree(projectId);
      set({ tree });
    } catch {
      // silent refresh failure — don't clear existing tree
    }
  },

  toggleMilestone: (id: string) => {
    const next = new Set(get().expandedMilestones);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ expandedMilestones: next });
  },

  toggleTask: (id: string) => {
    const next = new Set(get().expandedTasks);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ expandedTasks: next });
  },

  expandAll: () => {
    const { tree } = get();
    if (!tree) return;
    const milestoneIds = new Set(tree.milestones.map(m => m.id));
    const taskIds = new Set(
      tree.milestones.flatMap(m => m.tasks.filter(t => t.subtasks.length > 0).map(t => t.id))
    );
    set({ expandedMilestones: milestoneIds, expandedTasks: taskIds });
  },

  collapseAll: () => {
    set({ expandedMilestones: new Set(), expandedTasks: new Set() });
  },

  patchMilestones: (milestones: PlanningMilestone[]) => {
    const tree = get().tree;
    if (!tree) return;
    set({ tree: { ...tree, milestones } });
  },

  reset: () => set({ tree: null, loading: false, error: null, projectId: null, expandedMilestones: new Set(), expandedTasks: new Set() }),
}));
