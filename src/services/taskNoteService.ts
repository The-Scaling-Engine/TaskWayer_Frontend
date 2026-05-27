import api from './api';
import type { TaskNote } from '@/types';

export const taskNoteService = {
  getNotes: async (taskId: string): Promise<{ success: boolean; count: number; data: TaskNote[] }> => {
    const response = await api.get(`/tasks/${taskId}/notes`);
    return response.data;
  },

  addNote: async (taskId: string, content: string): Promise<{ success: boolean; data: TaskNote }> => {
    const response = await api.post(`/tasks/${taskId}/notes`, { content });
    return response.data;
  },

  updateNote: async (taskId: string, noteId: string, content: string): Promise<{ success: boolean; data: TaskNote }> => {
    const response = await api.patch(`/tasks/${taskId}/notes/${noteId}`, { content });
    return response.data;
  },

  toggleDone: async (taskId: string, noteId: string): Promise<{ success: boolean; data: TaskNote }> => {
    const response = await api.patch(`/tasks/${taskId}/notes/${noteId}/toggle`);
    return response.data;
  },

  reorderNotes: async (taskId: string, orderedIds: string[]): Promise<{ success: boolean }> => {
    const response = await api.patch(`/tasks/${taskId}/notes/reorder`, { orderedIds });
    return response.data;
  },

  deleteNote: async (taskId: string, noteId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/tasks/${taskId}/notes/${noteId}`);
    return response.data;
  },
};
