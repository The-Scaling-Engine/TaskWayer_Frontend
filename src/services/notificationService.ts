import api from './api';
import type { NotificationsResponse } from '@/types';

export const notificationService = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }): Promise<NotificationsResponse> => {
    const response = await api.get<NotificationsResponse>('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ success: boolean; data: { count: number } }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};
