import api from './api';
import type { Task } from '@/types';

export interface CreateSubtaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  deadline?: string | null;
}

export interface UpdateSubtaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done';
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  deadline?: string | null;
}

export const subtaskService = {
  list: async (parentId: string): Promise<{ success: boolean; count: number; data: Task[] }> => {
    const response = await api.get(`/tasks/${parentId}/subtasks`);
    return response.data;
  },

  create: async (parentId: string, data: CreateSubtaskData): Promise<{ success: boolean; data: Task }> => {
    const response = await api.post(`/tasks/${parentId}/subtasks`, data);
    return response.data;
  },

  update: async (parentId: string, subtaskId: string, data: UpdateSubtaskData): Promise<{ success: boolean; data: Task }> => {
    const response = await api.put(`/tasks/${parentId}/subtasks/${subtaskId}`, data);
    return response.data;
  },

  delete: async (parentId: string, subtaskId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/tasks/${parentId}/subtasks/${subtaskId}`);
    return response.data;
  },

  move: async (parentId: string, subtaskId: string, newParentId: string): Promise<{ success: boolean; data: Task }> => {
    const response = await api.post(`/tasks/${parentId}/subtasks/${subtaskId}/move`, { newParentId });
    return response.data;
  },
};
