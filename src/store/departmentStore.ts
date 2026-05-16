import { create } from 'zustand';
import { departmentService } from '@/services/departmentService';
import type { MyDepartmentMembership } from '@/types';

interface DepartmentStore {
  myDepartments: MyDepartmentMembership[];
  loading: boolean;
  hasFetched: boolean;
  fetchMyDepartments: () => Promise<void>;
  reset: () => void;
}

export const useDepartmentStore = create<DepartmentStore>((set) => ({
  myDepartments: [],
  loading: false,
  hasFetched: false,

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

  reset: () => set({ myDepartments: [], loading: false, hasFetched: false }),
}));
