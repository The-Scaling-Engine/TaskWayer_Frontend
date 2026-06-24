import api from './api';
import type { TeamOverviewMember, TeamOverviewTask } from '@/types';

export interface AssignTaskPayload {
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  scheduledAt?: string;
  tags?: string[];
  estimatedHours?: number;
  targetProfileId: string;
}

export const adminTeamService = {
  getOverview: async (): Promise<TeamOverviewMember[]> => {
    const res = await api.get('/admin/team/overview');
    return res.data.data;
  },

  getMemberTasks: async (profileId: string): Promise<TeamOverviewTask[]> => {
    const res = await api.get(`/admin/team/overview/${profileId}/tasks`);
    return res.data.data;
  },

  assignTask: async (payload: AssignTaskPayload): Promise<void> => {
    await api.post('/tasks', payload);
  },
};
