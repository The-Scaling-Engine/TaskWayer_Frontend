import api from './api';
import type { Task, TasksResponse, TaskStatsResponse } from '@/types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  deadline?: string;
  departmentId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  deadline?: string;
  departmentId?: string;
}

export const taskService = {
  getTasks: async (params?: {
    status?: string;
    priority?: string;
    search?: string;
    tag?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
  }): Promise<TasksResponse> => {
    const response = await api.get<TasksResponse>('/tasks', { params });
    return response.data;
  },

  createTask: async (data: CreateTaskData): Promise<{ success: boolean; data: Task }> => {
    const payload = {
      ...data,
      deadline: data.deadline ? `${data.deadline}T00:00:00.000Z` : undefined,
    };
    const response = await api.post('/tasks', payload);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskData): Promise<{ success: boolean; data: Task }> => {
    const payload = {
      ...data,
      deadline: data.deadline ? `${data.deadline}T00:00:00.000Z` : data.deadline,
    };
    const response = await api.put(`/tasks/${id}`, payload);
    return response.data;
  },

  deleteTask: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getStats: async (): Promise<TaskStatsResponse> => {
    const response = await api.get<TaskStatsResponse>('/tasks/stats');
    return response.data;
  },
};
