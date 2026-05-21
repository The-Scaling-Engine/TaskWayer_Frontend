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
  deadlineFrom?: string;
  deadlineTo?: string;
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
  silentFetch: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  params: { limit: 50, page: 1 },
  pagination: null,

  setParams: (newParams) => {
    const updatedParams = { ...get().params, ...newParams };
    if (!newParams.page && (newParams.search !== undefined || newParams.status !== undefined || newParams.sortBy !== undefined || newParams.deadlineFrom !== undefined || newParams.deadlineTo !== undefined)) {
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
    await taskService.createTask(data);
    await get().silentFetch();
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    await taskService.updateTask(id, data);
    await get().silentFetch();
  },

  deleteTask: async (id: string) => {
    await taskService.deleteTask(id);
    await get().silentFetch();
  },

  silentFetch: async () => {
    try {
      const res = await taskService.getTasks(get().params);
      set({ tasks: res.data, pagination: res.pagination });
    } catch {
      // silent – don't disrupt UI
    }
  },
}));
