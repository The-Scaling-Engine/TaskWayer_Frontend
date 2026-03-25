import { create } from 'zustand';
import type { Task } from '@/types';
import { taskService, type CreateTaskData, type UpdateTaskData } from '@/services/taskService';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await taskService.getTasks({ limit: 50 });
      set({ tasks: res.data, loading: false });
    } catch {
      set({ error: 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (data: CreateTaskData) => {
    try {
      const res = await taskService.createTask(data);
      set({ tasks: [res.data, ...get().tasks] });
    } catch {
      set({ error: 'Failed to create task' });
    }
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    try {
      const res = await taskService.updateTask(id, data);
      set({
        tasks: get().tasks.map((t) => (t._id === id ? res.data : t)),
      });
    } catch {
      set({ error: 'Failed to update task' });
    }
  },

  deleteTask: async (id: string) => {
    try {
      await taskService.deleteTask(id);
      set({ tasks: get().tasks.filter((t) => t._id !== id) });
    } catch {
      set({ error: 'Failed to delete task' });
    }
  },
}));
