import api from './api';
import type { User } from '@/types';

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
}

export const userService = {
  getProfile: async (): Promise<{ success: boolean; data: User }> => {
    const response = await api.get<{ success: boolean; data: User }>('/user/profile');
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
