import api from './api';
import type { TimeTrackingSession, TimeSessionsResponse } from '@/types';

export const timeTrackingService = {
  startSession: async (taskId: string): Promise<{ success: boolean; data: TimeTrackingSession }> => {
    const response = await api.post('/time-tracking/sessions/start', { taskId });
    return response.data;
  },

  stopSession: async (): Promise<{ success: boolean; data: TimeTrackingSession }> => {
    const response = await api.post('/time-tracking/sessions/stop');
    return response.data;
  },

  getActiveSession: async (): Promise<{ success: boolean; data: TimeTrackingSession | null }> => {
    const response = await api.get('/time-tracking/sessions/active');
    return response.data;
  },

  getSessions: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TimeSessionsResponse> => {
    const response = await api.get<TimeSessionsResponse>('/time-tracking/sessions', { params });
    return response.data;
  },
};
