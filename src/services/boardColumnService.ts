import api from './api';
import type { BoardColumn, BoardColumnsResponse } from '@/types';

export const boardColumnService = {
  getColumns: async (projectId: string): Promise<BoardColumnsResponse> => {
    const response = await api.get<BoardColumnsResponse>(`/projects/${projectId}/columns`);
    return response.data;
  },

  createColumn: async (
    projectId: string,
    data: { name: string; color?: string }
  ): Promise<{ success: boolean; data: BoardColumn; message: string }> => {
    const response = await api.post(`/projects/${projectId}/columns`, data);
    return response.data;
  },

  updateColumn: async (
    projectId: string,
    columnId: string,
    data: { name?: string; color?: string }
  ): Promise<{ success: boolean; data: BoardColumn; message: string }> => {
    const response = await api.patch(`/projects/${projectId}/columns/${columnId}`, data);
    return response.data;
  },

  deleteColumn: async (
    projectId: string,
    columnId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${projectId}/columns/${columnId}`);
    return response.data;
  },

  reorderColumns: async (
    projectId: string,
    orderedIds: string[]
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/projects/${projectId}/columns/reorder`, { orderedIds });
    return response.data;
  },
};
