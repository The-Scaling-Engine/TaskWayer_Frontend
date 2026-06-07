import api from './api';
import type { User } from '@/types';

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  username?: string;
  jobTitle?: string;
}

export const userService = {
  getProfile: async (): Promise<{ success: boolean; data: User }> => {
    const response = await api.get<{ success: boolean; data: User }>('/user/profile');
    return response.data;
  },

  searchUsers: async (params: { q: string; limit?: number }): Promise<{ success: boolean; data: { users: { id: string; email: string; name?: string | null; avatar?: string | null; username?: string | null }[] } }> => {
    const response = await api.get('/user/search', { params });
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean; message: string; data: User }> => {
    const response = await api.put<{ success: boolean; message: string; data: User }>(
      '/user/profile',
      data
    );
    return response.data;
  },
};
