import { create } from 'zustand';
import type { User } from '@/types';
import { userService } from '@/services/userService';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('microdo_token'),
  user: JSON.parse(localStorage.getItem('microdo_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('microdo_token'),

  login: (token: string, user: User) => {
    localStorage.setItem('microdo_token', token);
    localStorage.setItem('microdo_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('microdo_token');
    localStorage.removeItem('microdo_user');
    localStorage.removeItem('microdo_task_dept_map');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const res = await userService.getProfile();
      if (res.success) {
        localStorage.setItem('microdo_user', JSON.stringify(res.data));
        set({ user: res.data });
      }
    } catch {
      // If profile fetch fails (e.g. token expired), the 401 interceptor handles logout
    }
  },

  updateUser: (user: User) => {
    localStorage.setItem('microdo_user', JSON.stringify(user));
    set({ user });
  },
}));
