import api from './api';
import type { Task, TasksResponse, TaskStatsResponse } from '@/types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  deadline?: string;
  scheduledAt?: string | null;
  projectId?: string;
  columnId?: string | null;
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  deadline?: string;
  scheduledAt?: string | null;
  columnId?: string | null;
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null;
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  assignedTo?: string | null;
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
    deadlineFrom?: string;
    deadlineTo?: string;
    createdFrom?: string;
    createdTo?: string;
    scheduledFrom?: string;
    scheduledTo?: string;
    personal?: boolean;
    projectId?: string;
  }): Promise<TasksResponse> => {
    const response = await api.get<TasksResponse>('/tasks', { params });
    return response.data;
  },

  createTask: async (data: CreateTaskData): Promise<{ success: boolean; data: Task }> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskData): Promise<{ success: boolean; data: Task }> => {
    const response = await api.put(`/tasks/${id}`, data);
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

  cancelRecurrence: async (id: string, keepChildren: boolean): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    const response = await api.post(`/tasks/${id}/cancel-recurrence`, { keepChildren });
    return response.data;
  },

  cancelFromDate: async (parentId: string, fromDate: string): Promise<{ success: boolean; message: string; data: { cancelled: number } }> => {
    const response = await api.post(`/tasks/${parentId}/cancel-from`, { fromDate });
    return response.data;
  },
};
