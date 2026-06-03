import api from './api';
import type { PlanningTree } from '@/types';

export const planningService = {
  getTree: async (projectId: string, skip = 0, take = 50): Promise<PlanningTree> => {
    const response = await api.get<{ success: boolean } & PlanningTree>(
      `/projects/${projectId}/planning?skip=${skip}&take=${take}`
    );
    return response.data;
  },

  reorderMilestoneTasks: async (
    projectId: string,
    milestoneId: string,
    orderedIds: string[]
  ): Promise<void> => {
    await api.patch(`/projects/${projectId}/milestones/${milestoneId}/tasks/reorder`, { orderedIds });
  },
};
