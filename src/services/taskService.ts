import api from './api';
import type { Task, TasksResponse } from '@/types';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  deadline?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  deadline?: string;
}

export const taskService = {
  getTasks: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
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
};
