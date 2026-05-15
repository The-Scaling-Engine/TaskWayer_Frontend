import api from './api';
import type {
  AnalyticsSummary,
  AnalyticsCompletion,
  AnalyticsTrend,
  AnalyticsTimeEntry,
  AnalyticsHeatmapEntry,
} from '@/types';

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsService = {
  getSummary: async (): Promise<{ success: boolean; data: AnalyticsSummary }> => {
    const response = await api.get('/analytics/summary');
    return response.data;
  },

  getCompletion: async (params: DateRangeParams): Promise<{ success: boolean; data: AnalyticsCompletion[] }> => {
    const response = await api.get('/analytics/completion', { params });
    return response.data;
  },

  getTrends: async (params: DateRangeParams): Promise<{ success: boolean; data: AnalyticsTrend[] }> => {
    const response = await api.get('/analytics/trends', { params });
    return response.data;
  },

  getTimeTracking: async (params?: DateRangeParams): Promise<{ success: boolean; data: AnalyticsTimeEntry }> => {
    const response = await api.get('/analytics/time', { params });
    return response.data;
  },

  getHeatmap: async (params?: DateRangeParams): Promise<{ success: boolean; data: AnalyticsHeatmapEntry[] }> => {
    const response = await api.get('/analytics/heatmap', { params });
    return response.data;
  },
};
