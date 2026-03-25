import { create } from 'zustand';
import type { Task, TasksResponse } from '@/types';
import { taskService, type CreateTaskData, type UpdateTaskData } from '@/services/taskService';

interface TaskQueryParams {
  search?: string;
  status?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  params: TaskQueryParams;
  pagination: TasksResponse['pagination'] | null;
  setParams: (newParams: Partial<TaskQueryParams>) => void;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  params: { limit: 50, page: 1 },
  pagination: null,

  setParams: (newParams) => {
    // If filter/search/sort change, reset to page 1 unless page explicitly passed
    const updatedParams = { ...get().params, ...newParams };
    if (!newParams.page && (newParams.search !== undefined || newParams.status !== undefined || newParams.sortBy !== undefined)) {
      updatedParams.page = 1;
    }
    set({ params: updatedParams });
    get().fetchTasks();
  },

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const res = await taskService.getTasks(get().params);
      set({ tasks: res.data, pagination: res.pagination, loading: false });
    } catch {
      set({ error: 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (data: CreateTaskData) => {
    try {
      await taskService.createTask(data);
      get().fetchTasks();
    } catch {
      set({ error: 'Failed to create task' });
    }
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    try {
      await taskService.updateTask(id, data);
      get().fetchTasks();
    } catch {
      set({ error: 'Failed to update task' });
    }
  },

  deleteTask: async (id: string) => {
    try {
      await taskService.deleteTask(id);
      get().fetchTasks();
    } catch {
      set({ error: 'Failed to delete task' });
    }
  },
}));
