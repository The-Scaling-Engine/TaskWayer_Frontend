import api from './api';
import type { DepartmentInvitation, InvitationsResponse } from '@/types';

export const invitationService = {
  sendInvitation: async (
    deptId: string,
    data: { email: string; role?: string }
  ): Promise<{ success: boolean; message: string; data: DepartmentInvitation }> => {
    const response = await api.post(`/departments/${deptId}/invitations`, data);
    return response.data;
  },

  getInvitations: async (deptId: string): Promise<InvitationsResponse> => {
    const response = await api.get(`/departments/${deptId}/invitations`);
    return response.data;
  },

  cancelInvitation: async (
    deptId: string,
    invitationId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/departments/${deptId}/invitations/${invitationId}`);
    return response.data;
  },

  acceptInvitation: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/invitations/${token}/accept`);
    return response.data;
  },

  rejectInvitation: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/invitations/${token}/reject`);
    return response.data;
  },
};
