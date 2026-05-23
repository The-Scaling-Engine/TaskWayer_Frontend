import api from './api';
import type { Todo } from '@/types';

interface TodoListResponse {
  success: boolean;
  count: number;
  data: Todo[];
}

interface TodoResponse {
  success: boolean;
  message: string;
  data: Todo;
}

export const todoService = {
  getAll: () => api.get<TodoListResponse>('/todos').then((r) => r.data),

  create: (text: string, tags: string[] = []) =>
    api.post<TodoResponse>('/todos', { text, tags }).then((r) => r.data),

  update: (id: string, data: { text?: string; done?: boolean; tags?: string[] }) =>
    api.patch<TodoResponse>(`/todos/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/todos/${id}`),
};
