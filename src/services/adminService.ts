import api from './api';
import type {
  AdminDashboardStats,
  AdminUsersResponse,
  AdminUser,
  Department,
  DepartmentWithMembers,
  DepartmentsResponse,
  AdminAnalyticsSummary,
  AdminAnalyticsDepartmentsResponse,
  AnalyticsTrend,
} from '@/types';

export const adminService = {
  getDashboard: async (): Promise<{ success: boolean; data: AdminDashboardStats }> => {
    const response = await api.get<{ success: boolean; data: AdminDashboardStats }>('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<AdminUsersResponse> => {
    const response = await api.get<AdminUsersResponse>('/admin/users', { params });
    return response.data;
  },

  createUser: async (data: { name: string; username: string; email: string }): Promise<{ success: boolean; message: string; data: AdminUser }> => {
    const response = await api.post<{ success: boolean; message: string; data: AdminUser }>('/admin/users', data);
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

  resendInvite: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(`/admin/users/${id}/resend-invite`);
    return response.data;
  },

  // ── Department CRUD ──────────────────────────────────────────

  createDepartment: async (data: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Department }> => {
    const response = await api.post('/admin/departments', data);
    return response.data;
  },

  getDepartments: async (params?: { page?: number; limit?: number }): Promise<DepartmentsResponse> => {
    const response = await api.get('/admin/departments', { params });
    return response.data;
  },

  getDepartmentById: async (id: string): Promise<{ success: boolean; data: DepartmentWithMembers }> => {
    const response = await api.get(`/admin/departments/${id}`);
    return response.data;
  },

  updateDepartment: async (id: string, data: { name?: string; description?: string }): Promise<{ success: boolean; message: string; data: Department }> => {
    const response = await api.patch(`/admin/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string, params?: { force?: boolean }): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/departments/${id}`, { params });
    return response.data;
  },

  // ── User ↔ Department ────────────────────────────────────────

  assignUserToDepartment: async (
    userId: string,
    data: { departmentId: string; role?: string }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/admin/users/${userId}/department`, data);
    return response.data;
  },

  removeUserFromDepartment: async (
    userId: string,
    data: { departmentId: string }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/admin/users/${userId}/department`, { data });
    return response.data;
  },

  // ── Admin Analytics ──────────────────────────────────────────

  getAdminAnalyticsSummary: async (): Promise<{ success: boolean; data: AdminAnalyticsSummary }> => {
    const response = await api.get('/admin/analytics/summary');
    return response.data;
  },

  getAdminAnalyticsTrends: async (params: { startDate: string; endDate: string }): Promise<{ success: boolean; data: { series: AnalyticsTrend[] } }> => {
    const response = await api.get('/admin/analytics/trends', { params });
    return response.data;
  },

  getAdminAnalyticsTime: async (params?: { startDate?: string; endDate?: string }): Promise<{ success: boolean; data: { summary: { totalDurationSeconds: number; sessionCount: number; averageSessionSeconds: number | null } } }> => {
    const response = await api.get('/admin/analytics/time', { params });
    return response.data;
  },

  getAdminAnalyticsDepartments: async (params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: AdminAnalyticsDepartmentsResponse }> => {
    const response = await api.get('/admin/analytics/departments', { params });
    return response.data;
  },
};
