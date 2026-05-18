import { supabase } from '@/lib/supabase';
import api from './api';
import type { User } from '@/types';

interface LoginResult {
  token: string;
  user: User;
}

const login = async (email: string, password: string): Promise<LoginResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const token = data.session.access_token;
  const profileRes = await api.get<{ data: User }>('/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { token, user: profileRes.data.data };
};

const forgotPassword = async (email: string): Promise<void> => {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
};

const changePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

export const authService = { login, forgotPassword, changePassword };
