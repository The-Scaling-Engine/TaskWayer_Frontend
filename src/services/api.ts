import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: get fresh token from Supabase session (handles auto-refresh)
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

type ApiErrorShape = {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ field?: string; message: string }>;
    };
  };
};

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const e = err as ApiErrorShape;
  const fieldErrors = e?.response?.data?.errors;
  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    return fieldErrors.map(fe => fe.message).join(' · ');
  }
  return e?.response?.data?.message ?? (err instanceof Error ? err.message : null) ?? fallback;
}

export default api;
