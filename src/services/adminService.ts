import api from './api';
import type { 
  AdminDashboardStats, 
  AdminUsersResponse, 
  AdminUser
} from '@/types';

export const adminService = {
  // Real APIs
  getDashboard: async (): Promise<{ success: boolean; data: AdminDashboardStats }> => {
    const response = await api.get<{ success: boolean; data: AdminDashboardStats }>('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<AdminUsersResponse> => {
    const response = await api.get<AdminUsersResponse>('/admin/users', { params });
    return response.data;
  },

  banUser: async (id: string): Promise<{ success: boolean; message: string; data: AdminUser }> => {
    const response = await api.patch<{ success: boolean; message: string; data: AdminUser }>(`/admin/users/${id}/ban`);
    return response.data;
  },

  unbanUser: async (id: string): Promise<{ success: boolean; message: string; data: AdminUser }> => {
    const response = await api.patch<{ success: boolean; message: string; data: AdminUser }>(`/admin/users/${id}/unban`);
    return response.data;
  }
};
