import api from './api';
import type {
  AnalyticsSummary,
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

  getTrends: async (params: DateRangeParams): Promise<{ success: boolean; data: { timezone: string; period: { startDate: string; endDate: string }; series: AnalyticsTrend[] } }> => {
    const response = await api.get('/analytics/trends', { params });
    return response.data;
  },

  getTimeTracking: async (params?: DateRangeParams): Promise<{ success: boolean; data: AnalyticsTimeEntry }> => {
    const response = await api.get('/analytics/time', { params });
    return response.data;
  },

  getHeatmap: async (params?: DateRangeParams): Promise<{ success: boolean; data: { timezone: string; period: { startDate: string; endDate: string }; heatmap: AnalyticsHeatmapEntry[]; summary: { peakDayOfWeek: number | null; peakHour: number | null; totalCreated: number; totalCompleted: number } } }> => {
    const response = await api.get('/analytics/heatmap', { params });
    return response.data;
  },
};
