import { create } from 'zustand';
import type { Task, TasksResponse } from '@/types';
import { taskService, type CreateTaskData, type UpdateTaskData } from '@/services/taskService';

// Persist departmentId per task in localStorage since GET /tasks doesn't return it
const DEPT_MAP_KEY = 'microdo_task_dept_map';
function loadDeptMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(DEPT_MAP_KEY) ?? '{}'); } catch { return {}; }
}
function saveDeptMap(map: Record<string, string>) {
  try { localStorage.setItem(DEPT_MAP_KEY, JSON.stringify(map)); } catch {}
}

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
  taskDeptMap: Record<string, string>;
  setParams: (newParams: Partial<TaskQueryParams>) => void;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearDeptMap: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  params: { limit: 50, page: 1 },
  pagination: null,
  taskDeptMap: loadDeptMap(),

  setParams: (newParams) => {
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
      const deptMap = get().taskDeptMap;
      // Merge persisted departmentId back into tasks (BE doesn't return this field)
      const tasks = res.data.map((t) => ({
        ...t,
        departmentId: t.departmentId || deptMap[t._id] || undefined,
      }));
      set({ tasks, pagination: res.pagination, loading: false });
    } catch {
      set({ error: 'Failed to fetch tasks', loading: false });
    }
  },

  createTask: async (data: CreateTaskData) => {
    const res = await taskService.createTask(data);
    // Save departmentId to map so it survives re-fetches
    const taskId = res.data?._id ?? (res.data as unknown as { id?: string })?.id;
    if (data.departmentId && taskId) {
      const newMap = { ...get().taskDeptMap, [taskId]: data.departmentId };
      set({ taskDeptMap: newMap });
      saveDeptMap(newMap);
    }
    get().fetchTasks();
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    await taskService.updateTask(id, data);
    // Update map only when departmentId is explicitly part of the update payload
    if ('departmentId' in data) {
      const currentMap = { ...get().taskDeptMap };
      if (data.departmentId) {
        currentMap[id] = data.departmentId;
      } else {
        delete currentMap[id];
      }
      set({ taskDeptMap: currentMap });
      saveDeptMap(currentMap);
    }
    get().fetchTasks();
  },

  deleteTask: async (id: string) => {
    await taskService.deleteTask(id);
    // Remove from map on delete
    const newMap = { ...get().taskDeptMap };
    delete newMap[id];
    set({ taskDeptMap: newMap });
    saveDeptMap(newMap);
    get().fetchTasks();
  },

  clearDeptMap: () => {
    set({ taskDeptMap: {} });
    try { localStorage.removeItem(DEPT_MAP_KEY); } catch {}
  },
}));
