import api from './api';
import type { DepartmentMember, DepartmentMembersResponse, MyDepartmentMembership, WorkloadResponse, ActiveSessionResponse, TasksResponse, Task } from '@/types';

export const departmentService = {
  getMembers: async (
    deptId: string,
    params?: { page?: number; limit?: number }
  ): Promise<DepartmentMembersResponse> => {
    const response = await api.get(`/departments/${deptId}/members`, { params });
    return response.data;
  },

  addMember: async (
    deptId: string,
    data: { userId: string; role?: string }
  ): Promise<{ success: boolean; message: string; data: DepartmentMember }> => {
    const response = await api.post(`/departments/${deptId}/members`, data);
    return response.data;
  },

  removeMember: async (
    deptId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/departments/${deptId}/members/${userId}`);
    return response.data;
  },

  changeMemberRole: async (
    deptId: string,
    userId: string,
    data: { role: string }
  ): Promise<{ success: boolean; message: string; data: DepartmentMember }> => {
    const response = await api.patch(`/departments/${deptId}/members/${userId}/role`, data);
    return response.data;
  },

  transferOwnership: async (
    deptId: string,
    data: { newOwnerId: string }
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/departments/${deptId}/transfer-ownership`, data);
    return response.data;
  },

  getUserMemberships: async (): Promise<{ success: boolean; data: MyDepartmentMembership[] }> => {
    const response = await api.get('/user/memberships');
    return response.data;
  },

  getWorkload: async (
    deptId: string,
    params?: { page?: number; limit?: number }
  ): Promise<WorkloadResponse> => {
    const response = await api.get(`/departments/${deptId}/workload`, { params });
    return response.data;
  },

  getMemberActiveSession: async (
    deptId: string,
    userId: string
  ): Promise<ActiveSessionResponse> => {
    const response = await api.get(`/departments/${deptId}/members/${userId}/time-tracking/active`);
    return response.data;
  },

  getMemberTasks: async (
    deptId: string,
    userId: string,
    params?: { status?: string; priority?: string; page?: number; limit?: number }
  ): Promise<TasksResponse> => {
    const response = await api.get(`/departments/${deptId}/members/${userId}/tasks`, { params });
    return response.data;
  },

  assignTask: async (
    deptId: string,
    userId: string,
    data: {
      title: string; description?: string; priority?: string; deadline?: string;
      scheduledAt?: string; tags?: string[];
      isRecurring?: boolean; recurrenceType?: string | null; recurrenceEndDate?: string | null;
    }
  ): Promise<{ success: boolean; message: string; data: Task }> => {
    const response = await api.post(`/departments/${deptId}/members/${userId}/assign-task`, data);
    return response.data;
  },
};
