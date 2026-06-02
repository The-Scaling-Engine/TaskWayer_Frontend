import api from './api';
import type { Milestone, MilestonesResponse, MilestoneStatus } from '@/types';

export interface CreateMilestoneData {
  title: string;
  description?: string;
  startDate?: string | null;
  deadline?: string | null;
}

export interface UpdateMilestoneData {
  title?: string;
  description?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  status?: MilestoneStatus;
}

export const milestoneService = {
  getMilestones: async (projectId: string): Promise<MilestonesResponse> => {
    const response = await api.get<MilestonesResponse>(`/projects/${projectId}/milestones`);
    return response.data;
  },

  createMilestone: async (
    projectId: string,
    data: CreateMilestoneData
  ): Promise<{ success: boolean; data: Milestone; message: string }> => {
    const response = await api.post(`/projects/${projectId}/milestones`, data);
    return response.data;
  },

  updateMilestone: async (
    projectId: string,
    milestoneId: string,
    data: UpdateMilestoneData
  ): Promise<{ success: boolean; data: Milestone; message: string }> => {
    const response = await api.patch(`/projects/${projectId}/milestones/${milestoneId}`, data);
    return response.data;
  },

  deleteMilestone: async (
    projectId: string,
    milestoneId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  },

  reorderMilestones: async (
    projectId: string,
    items: { id: string; order: number }[]
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/projects/${projectId}/milestones/reorder`, { items });
    return response.data;
  },
};
