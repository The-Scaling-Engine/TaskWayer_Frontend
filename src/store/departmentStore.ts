import { create } from 'zustand';
import { departmentService } from '@/services/departmentService';
import type { MyDepartmentMembership } from '@/types';

interface DepartmentStore {
  myDepartments: MyDepartmentMembership[];
  loading: boolean;
  hasFetched: boolean;
  fetchMyDepartments: () => Promise<void>;

  allMemberships: MyDepartmentMembership[];
  fetchAllMemberships: () => Promise<void>;

  reset: () => void;
}

export const useDepartmentStore = create<DepartmentStore>((set) => ({
  myDepartments: [],
  loading: false,
  hasFetched: false,

  allMemberships: [],

  fetchMyDepartments: async () => {
    set({ loading: true });
    try {
      const res = await departmentService.getUserMemberships();
      if (res.success) {
        const managed = res.data.filter(
          (m) => m.status === 'ACTIVE' && (m.role === 'OWNER' || m.role === 'ADMIN')
        );
        set({ myDepartments: managed, hasFetched: true });
      }
    } catch {
      set({ hasFetched: true });
    } finally {
      set({ loading: false });
    }
  },

  fetchAllMemberships: async () => {
    try {
      const res = await departmentService.getUserMemberships();
      if (res.success) {
        const active = res.data.filter((m) => m.status === 'ACTIVE');
        set({ allMemberships: active });
      }
    } catch {
      // silent
    }
  },

  reset: () => set({ myDepartments: [], loading: false, hasFetched: false, allMemberships: [] }),
}));
