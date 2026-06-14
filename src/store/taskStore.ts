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
  columnId?: string;
}

interface TaskState {
  // Project mode state (tasks array — legacy, used for moveTask etc.)
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

  // Project mode per-column state (board columns, paginated)
  projectColTasks: Record<string, Task[]>;
  projectColPaginations: Record<string, Pagination | null>;
  projectColLoading: boolean;
  projectColIds: string[];

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
  fetchPersonalTasks: (params: Partial<TaskQueryParams>, options?: { silent?: boolean }) => Promise<void>;
  loadMoreColumn: (status: ColumnKey) => Promise<void>;
  silentRefreshPersonal: () => Promise<void>;

  // Project col mode actions
  fetchProjectColTasks: (columnIds: string[], options?: { silent?: boolean }) => Promise<void>;
  loadMoreProjectCol: (columnId: string) => Promise<void>;
  silentRefreshProjectCols: () => Promise<void>;
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

  projectColTasks: {},
  projectColPaginations: {},
  projectColLoading: false,
  projectColIds: [],

  setParams: (newParams) => {
    const updatedParams = { ...get().params, ...newParams };
    if (!newParams.page && (newParams.search !== undefined || newParams.status !== undefined || newParams.sortBy !== undefined || newParams.deadlineFrom !== undefined || newParams.deadlineTo !== undefined)) {
      updatedParams.page = 1;
    }
    set({ params: updatedParams });
    void get().silentFetch();
  },

  resetParams: (overrides) => {
    set({ tasks: [], params: { limit: 50, page: 1, ...overrides }, personalBaseParams: {}, projectColIds: [], projectColTasks: {}, projectColPaginations: {} });
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

  fetchPersonalTasks: async (params, options) => {
    const baseParams: Partial<TaskQueryParams> = { ...params, personal: true };
    if (!options?.silent) set({ columnLoading: true });
    set({ personalBaseParams: baseParams });
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
    const prevColTasks = get().projectColTasks;
    set({ tasks: prev.map((t) => (t._id === id ? { ...t, columnId, ...(status && { status }) } : t)) });
    // Optimistic update for projectColTasks
    if (Object.keys(prevColTasks).length > 0) {
      const task = Object.values(prevColTasks).flat().find(t => t._id === id);
      if (task) {
        const oldColId = task.columnId;
        const updTask = { ...task, columnId, ...(status && { status }) } as Task;
        const newColTasks = { ...prevColTasks };
        if (oldColId && newColTasks[oldColId]) newColTasks[oldColId] = newColTasks[oldColId].filter(t => t._id !== id);
        if (newColTasks[columnId]) newColTasks[columnId] = [updTask, ...newColTasks[columnId].filter(t => t._id !== id)];
        set({ projectColTasks: newColTasks });
      }
    }
    try {
      await taskService.updateTask(id, { columnId, ...(status && { status }) });
      void get().silentRefreshProjectCols();
    } catch (err) {
      set({ tasks: prev, projectColTasks: prevColTasks });
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
      } else if (get().projectColIds.length > 0) {
        await get().silentRefreshProjectCols();
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
    const { columnTasks, projectColTasks } = get();
    const patchInCol = (arr: Task[]) => arr.map(t => t._id === id ? { ...t, ...partial } : t);
    set({
      columnTasks: {
        todo: patchInCol(columnTasks.todo),
        doing: patchInCol(columnTasks.doing),
        done: patchInCol(columnTasks.done),
      },
    });
    if (Object.keys(projectColTasks).length > 0) {
      const patched: Record<string, Task[]> = {};
      for (const [colId, colArr] of Object.entries(projectColTasks)) patched[colId] = patchInCol(colArr);
      set({ projectColTasks: patched });
    }
  },

  fetchProjectColTasks: async (columnIds, options) => {
    const { params } = get();
    set({ projectColIds: columnIds });
    if (!options?.silent) set({ projectColLoading: true });
    try {
      const results = await Promise.all(
        columnIds.map(colId => taskService.getTasks({ ...params, columnId: colId, page: 1, limit: 20 }))
      );
      const newColTasks: Record<string, Task[]> = {};
      const newColPaginations: Record<string, Pagination | null> = {};
      columnIds.forEach((colId, i) => {
        newColTasks[colId] = results[i].data;
        newColPaginations[colId] = results[i].pagination;
      });
      set({ projectColTasks: newColTasks, projectColPaginations: newColPaginations, projectColLoading: false });
    } catch {
      set({ projectColLoading: false });
    }
  },

  loadMoreProjectCol: async (columnId) => {
    const { params, projectColPaginations } = get();
    const pagination = projectColPaginations[columnId];
    if (!pagination?.hasNextPage) return;
    const res = await taskService.getTasks({ ...params, columnId, page: pagination.currentPage + 1, limit: 20 });
    set({
      projectColTasks: { ...get().projectColTasks, [columnId]: [...(get().projectColTasks[columnId] ?? []), ...res.data] },
      projectColPaginations: { ...get().projectColPaginations, [columnId]: res.pagination },
    });
  },

  silentRefreshProjectCols: async () => {
    const { projectColIds, params } = get();
    if (!projectColIds.length) return;
    try {
      const results = await Promise.allSettled(
        projectColIds.map(colId => taskService.getTasks({ ...params, columnId: colId, page: 1, limit: 20 }))
      );
      const newColTasks = { ...get().projectColTasks };
      const newColPaginations = { ...get().projectColPaginations };
      projectColIds.forEach((colId, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          newColTasks[colId] = r.value.data;
          newColPaginations[colId] = r.value.pagination;
        }
      });
      set({ projectColTasks: newColTasks, projectColPaginations: newColPaginations });
    } catch {
      // silent
    }
  },
}));
