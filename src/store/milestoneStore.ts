import { create } from 'zustand';
import { milestoneService, type CreateMilestoneData, type UpdateMilestoneData } from '@/services/milestoneService';
import type { Milestone } from '@/types';

interface MilestoneState {
  milestones: Milestone[];
  loading: boolean;
  projectId: string | null;

  fetch: (projectId: string) => Promise<void>;
  create: (projectId: string, data: CreateMilestoneData) => Promise<Milestone>;
  update: (projectId: string, milestoneId: string, data: UpdateMilestoneData) => Promise<Milestone>;
  remove: (projectId: string, milestoneId: string) => Promise<void>;
  reorder: (projectId: string, items: { id: string; order: number }[]) => Promise<void>;
  reset: () => void;
}

export const useMilestoneStore = create<MilestoneState>((set, get) => ({
  milestones: [],
  loading: false,
  projectId: null,

  fetch: async (projectId: string) => {
    set({ loading: true, projectId });
    try {
      const res = await milestoneService.getMilestones(projectId);
      set({ milestones: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  create: async (projectId: string, data: CreateMilestoneData) => {
    const res = await milestoneService.createMilestone(projectId, data);
    set(s => ({ milestones: [...s.milestones, res.data] }));
    return res.data;
  },

  update: async (projectId: string, milestoneId: string, data: UpdateMilestoneData) => {
    const res = await milestoneService.updateMilestone(projectId, milestoneId, data);
    set(s => ({
      milestones: s.milestones.map(m => m.id === milestoneId ? res.data : m),
    }));
    return res.data;
  },

  remove: async (projectId: string, milestoneId: string) => {
    await milestoneService.deleteMilestone(projectId, milestoneId);
    set(s => ({ milestones: s.milestones.filter(m => m.id !== milestoneId) }));
  },

  reorder: async (projectId: string, items: { id: string; order: number }[]) => {
    await milestoneService.reorderMilestones(projectId, items);
    const reordered = [...get().milestones];
    items.forEach(({ id, order }) => {
      const idx = reordered.findIndex(m => m.id === id);
      if (idx !== -1) reordered[idx] = { ...reordered[idx]!, order };
    });
    reordered.sort((a, b) => a.order - b.order);
    set({ milestones: reordered });
  },

  reset: () => set({ milestones: [], loading: false, projectId: null }),
}));
