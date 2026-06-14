import { create } from 'zustand';
import type { Task, TasksResponse } from '@/types';
import { taskService, type CreateTaskData, type UpdateTaskData } from '@/services/taskService';

type Pagination = TasksResponse['pagination'];
type ColumnKey = 'todo' | 'doing' | 'done';

interface TaskQueryParams {
  search?: string;
  status?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
  deadlineFrom?: string;
  deadlineTo?: string;
  personal?: boolean;
  projectId?: string;
}

interface TaskState {
  // Project mode state
  tasks: Task[];
  loading: boolean;
  error: string | null;
  params: TaskQueryParams;
  pagination: Pagination | null;

  // Personal mode per-column state
  columnTasks: { todo: Task[]; doing: Task[]; done: Task[] };
  columnPaginations: { todo: Pagination | null; doing: Pagination | null; done: Pagination | null };
  columnLoading: boolean;
  personalBaseParams: Partial<TaskQueryParams>;

  // Actions
  setParams: (newParams: Partial<TaskQueryParams>) => void;
  resetParams: (overrides?: Partial<TaskQueryParams>) => void;
  fetchTasks: () => Promise<void>;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
  moveTask: (id: string, status: ColumnKey) => Promise<void>;
  moveTaskToColumn: (id: string, columnId: string, status?: ColumnKey) => Promise<void>;
  cancelRecurrence: (id: string, keepChildren: boolean) => Promise<string>;
  deleteTask: (id: string) => Promise<void>;
  silentFetch: () => Promise<void>;
  patchTask: (id: string, partial: Partial<Task>) => void;

  // Personal mode actions
  fetchPersonalTasks: (params: Partial<TaskQueryParams>) => Promise<void>;
  loadMoreColumn: (status: ColumnKey) => Promise<void>;
  silentRefreshPersonal: () => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  params: { limit: 50, page: 1 },
  pagination: null,

  columnTasks: { todo: [], doing: [], done: [] },
  columnPaginations: { todo: null, doing: null, done: null },
  columnLoading: true, // true so spinner shows on personal board initial load
  personalBaseParams: {},

  setParams: (newParams) => {
    const updatedParams = { ...get().params, ...newParams };
    if (!newParams.page && (newParams.search !== undefined || newParams.status !== undefined || newParams.sortBy !== undefined || newParams.deadlineFrom !== undefined || newParams.deadlineTo !== undefined)) {
      updatedParams.page = 1;
    }
    set({ params: updatedParams });
    get().fetchTasks();
  },

  resetParams: (overrides) => {
    set({ tasks: [], params: { limit: 50, page: 1, ...overrides }, personalBaseParams: {} });
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

  fetchPersonalTasks: async (params) => {
    const baseParams: Partial<TaskQueryParams> = { ...params, personal: true };
    set({ columnLoading: true, personalBaseParams: baseParams });
    try {
      const [todo, doing, done] = await Promise.all([
        taskService.getTasks({ ...baseParams, status: 'todo', page: 1, limit: 20 }),
        taskService.getTasks({ ...baseParams, status: 'doing', page: 1, limit: 20 }),
        taskService.getTasks({ ...baseParams, status: 'done', page: 1, limit: 20 }),
      ]);
      set({
        columnTasks: { todo: todo.data, doing: doing.data, done: done.data },
        columnPaginations: { todo: todo.pagination, doing: doing.pagination, done: done.pagination },
        columnLoading: false,
      });
    } catch {
      set({ columnLoading: false });
    }
  },

  loadMoreColumn: async (status) => {
    const pagination = get().columnPaginations[status];
    if (!pagination?.hasNextPage) return;
    const res = await taskService.getTasks({
      ...get().personalBaseParams,
      status,
      page: pagination.currentPage + 1,
      limit: 20,
    });
    set({
      columnTasks: {
        ...get().columnTasks,
        [status]: [...get().columnTasks[status], ...res.data],
      },
      columnPaginations: {
        ...get().columnPaginations,
        [status]: res.pagination,
      },
    });
  },

  silentRefreshPersonal: async () => {
    const baseParams = get().personalBaseParams;
    if (!baseParams.personal) return;
    try {
      const [todo, doing, done] = await Promise.allSettled([
        taskService.getTasks({ ...baseParams, status: 'todo', page: 1, limit: 20 }),
        taskService.getTasks({ ...baseParams, status: 'doing', page: 1, limit: 20 }),
        taskService.getTasks({ ...baseParams, status: 'done', page: 1, limit: 20 }),
      ]);
      set({
        columnTasks: {
          todo: todo.status === 'fulfilled' ? todo.value.data : get().columnTasks.todo,
          doing: doing.status === 'fulfilled' ? doing.value.data : get().columnTasks.doing,
          done: done.status === 'fulfilled' ? done.value.data : get().columnTasks.done,
        },
        columnPaginations: {
          todo: todo.status === 'fulfilled' ? todo.value.pagination : get().columnPaginations.todo,
          doing: doing.status === 'fulfilled' ? doing.value.pagination : get().columnPaginations.doing,
          done: done.status === 'fulfilled' ? done.value.pagination : get().columnPaginations.done,
        },
      });
    } catch {
      // silent
    }
  },

  createTask: async (data: CreateTaskData) => {
    await taskService.createTask(data);
    if (get().personalBaseParams.personal) {
      await get().silentRefreshPersonal();
    } else {
      await get().silentFetch();
    }
  },

  updateTask: async (id: string, data: UpdateTaskData) => {
    if (get().personalBaseParams.personal) {
      const prevColumnTasks = get().columnTasks;
      const updateInCol = (arr: Task[]) => arr.map(t => t._id === id ? { ...t, ...data } as Task : t);
      set({
        columnTasks: {
          todo: updateInCol(prevColumnTasks.todo),
          doing: updateInCol(prevColumnTasks.doing),
          done: updateInCol(prevColumnTasks.done),
        },
      });
      try {
        await taskService.updateTask(id, data);
        void get().silentRefreshPersonal();
      } catch (err) {
        set({ columnTasks: prevColumnTasks });
        throw err;
      }
    } else {
      const prev = get().tasks;
      set({ tasks: prev.map(t => t._id === id ? { ...t, ...data } as Task : t) });
      try {
        await taskService.updateTask(id, data);
        void get().silentFetch();
      } catch (err) {
        set({ tasks: prev });
        throw err;
      }
    }
  },

  moveTask: async (id: string, status: ColumnKey) => {
    if (get().personalBaseParams.personal) {
      const prevColumnTasks = get().columnTasks;
      const allTasks = [...prevColumnTasks.todo, ...prevColumnTasks.doing, ...prevColumnTasks.done];
      const task = allTasks.find(t => t._id === id);
      if (!task) return;
      const prevStatus = task.status as ColumnKey;
      if (prevStatus === status) return;
      set({
        columnTasks: {
          ...prevColumnTasks,
          [prevStatus]: prevColumnTasks[prevStatus].filter(t => t._id !== id),
          [status]: [{ ...task, status }, ...prevColumnTasks[status]],
        },
      });
      try {
        await taskService.updateTask(id, { status });
      } catch (err) {
        set({ columnTasks: prevColumnTasks });
        throw err;
      }
    } else {
      const prev = get().tasks;
      set({ tasks: prev.map((t) => (t._id === id ? { ...t, status } : t)) });
      try {
        await taskService.updateTask(id, { status });
      } catch (err) {
        set({ tasks: prev });
        throw err;
      }
    }
  },

  moveTaskToColumn: async (id: string, columnId: string, status?: ColumnKey) => {
    const prev = get().tasks;
    set({ tasks: prev.map((t) => (t._id === id ? { ...t, columnId, ...(status && { status }) } : t)) });
    try {
      await taskService.updateTask(id, { columnId, ...(status && { status }) });
    } catch (err) {
      set({ tasks: prev });
      throw err;
    }
  },

  cancelRecurrence: async (id: string, keepChildren: boolean) => {
    const res = await taskService.cancelRecurrence(id, keepChildren);
    if (get().personalBaseParams.personal) {
      await get().silentRefreshPersonal();
    } else {
      await get().silentFetch();
    }
    return res.message;
  },

  deleteTask: async (id: string) => {
    await taskService.deleteTask(id);
    if (get().personalBaseParams.personal) {
      await get().silentRefreshPersonal();
    } else {
      await get().silentFetch();
    }
  },

  silentFetch: async () => {
    try {
      if (get().personalBaseParams.personal) {
        await get().silentRefreshPersonal();
      } else {
        const res = await taskService.getTasks(get().params);
        set({ tasks: res.data, pagination: res.pagination });
      }
    } catch {
      // silent
    }
  },

  patchTask: (id, partial) => {
    set({ tasks: get().tasks.map(t => t._id === id ? { ...t, ...partial } : t) });
    const { columnTasks } = get();
    const patchInCol = (arr: Task[]) => arr.map(t => t._id === id ? { ...t, ...partial } : t);
    set({
      columnTasks: {
        todo: patchInCol(columnTasks.todo),
        doing: patchInCol(columnTasks.doing),
        done: patchInCol(columnTasks.done),
      },
    });
  },
}));
