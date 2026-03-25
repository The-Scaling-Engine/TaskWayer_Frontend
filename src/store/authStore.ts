import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
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
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('microdo_user', JSON.stringify(user));
    set({ user });
  },
}));
