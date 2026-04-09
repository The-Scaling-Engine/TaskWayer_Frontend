import api from './api';
import type { 
  AdminDashboardStats, 
  AdminUsersResponse, 
  AdminUser, 
  RevenueDataPoint, 
  UserGrowthPoint 
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
  },

  // Mock functions for charts (since requested in .cursorrule)
  getRevenueData: async (): Promise<{ success: boolean; data: RevenueDataPoint[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: [
        { date: "2026-04-01", revenue: 120 },
        { date: "2026-04-02", revenue: 200 },
        { date: "2026-04-03", revenue: 150 },
        { date: "2026-04-04", revenue: 310 },
        { date: "2026-04-05", revenue: 270 },
        { date: "2026-04-06", revenue: 420 },
        { date: "2026-04-07", revenue: 380 },
      ]
    };
  },

  getUserGrowthData: async (): Promise<{ success: boolean; data: UserGrowthPoint[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: [
        { date: "2026-04-01", totalUsers: 10 },
        { date: "2026-04-02", totalUsers: 25 },
        { date: "2026-04-03", totalUsers: 33 },
        { date: "2026-04-04", totalUsers: 48 },
        { date: "2026-04-05", totalUsers: 60 },
        { date: "2026-04-06", totalUsers: 85 },
        { date: "2026-04-07", totalUsers: 102 },
      ]
    };
  }
};
