import api from './api';
import type { CommentsResponse, Comment } from '@/types';

export const commentService = {
  getComments: async (
    taskId: string,
    params?: { page?: number; limit?: number }
  ): Promise<CommentsResponse> => {
    const response = await api.get<CommentsResponse>(`/tasks/${taskId}/comments`, { params });
    return response.data;
  },

  createComment: async (
    taskId: string,
    data: { content: string; parentId?: string }
  ): Promise<{ success: boolean; data: Comment }> => {
    const response = await api.post(`/tasks/${taskId}/comments`, data);
    return response.data;
  },

  updateComment: async (
    commentId: string,
    data: { content: string }
  ): Promise<{ success: boolean; data: Comment }> => {
    const response = await api.patch(`/comments/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};
