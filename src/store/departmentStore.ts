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
        const normalize = (m: (typeof res.data)[number]) => {
          const dept = m.department as typeof m.department & { _id?: string };
          return { ...m, department: { ...dept, id: dept.id ?? dept._id ?? '' } };
        };
        const managed = res.data
          .filter((m) => m.status === 'ACTIVE')
          .map(normalize);
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
        const active = res.data
          .filter((m) => m.status === 'ACTIVE')
          .map((m) => {
            const dept = m.department as typeof m.department & { _id?: string };
            return { ...m, department: { ...dept, id: dept.id ?? dept._id ?? '' } };
          });
        set({ allMemberships: active });
      }
    } catch {
      // silent
    }
  },

  reset: () => set({ myDepartments: [], loading: false, hasFetched: false, allMemberships: [] }),
}));
