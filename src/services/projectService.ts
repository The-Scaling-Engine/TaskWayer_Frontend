import api from './api';
import type {
  ProjectMember,
  ProjectMemberRole,
  ProjectsResponse,
  ProjectResponse,
  ProjectMembersResponse,
} from '@/types';

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export const projectService = {
  // ── Project CRUD ──────────────────────────────────────────────

  getProjects: async (): Promise<ProjectsResponse> => {
    const response = await api.get<ProjectsResponse>('/projects');
    return response.data;
  },

  getProjectById: async (id: string): Promise<ProjectResponse> => {
    const response = await api.get<ProjectResponse>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: CreateProjectData): Promise<ProjectResponse> => {
    const response = await api.post<ProjectResponse>('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: UpdateProjectData): Promise<ProjectResponse> => {
    const response = await api.patch<ProjectResponse>(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // ── Lifecycle ─────────────────────────────────────────────────

  archiveProject: async (id: string): Promise<ProjectResponse> => {
    const response = await api.patch<ProjectResponse>(`/projects/${id}/archive`);
    return response.data;
  },

  unarchiveProject: async (id: string): Promise<ProjectResponse> => {
    const response = await api.patch<ProjectResponse>(`/projects/${id}/unarchive`);
    return response.data;
  },

  leaveProject: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/projects/${id}/leave`);
    return response.data;
  },

  transferOwnership: async (id: string, newOwnerId: string): Promise<{ success: boolean; data: ProjectMember; message: string }> => {
    const response = await api.patch(`/projects/${id}/transfer-ownership`, { newOwnerId });
    return response.data;
  },

  // ── Members ───────────────────────────────────────────────────

  getMembers: async (projectId: string): Promise<ProjectMembersResponse> => {
    const response = await api.get<ProjectMembersResponse>(`/projects/${projectId}/members`);
    return response.data;
  },

  addMember: async (
    projectId: string,
    data: { profileId: string; role?: ProjectMemberRole }
  ): Promise<{ success: boolean; data: ProjectMember; message: string }> => {
    const response = await api.post(`/projects/${projectId}/members`, data);
    return response.data;
  },

  removeMember: async (
    projectId: string,
    profileId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${projectId}/members/${profileId}`);
    return response.data;
  },

  updateMemberRole: async (
    projectId: string,
    profileId: string,
    role: ProjectMemberRole
  ): Promise<{ success: boolean; data: ProjectMember; message: string }> => {
    const response = await api.patch(`/projects/${projectId}/members/${profileId}`, { role });
    return response.data;
  },

  // ── Departments ───────────────────────────────────────────────

  linkDepartment: async (
    projectId: string,
    departmentId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/projects/${projectId}/departments`, { departmentId });
    return response.data;
  },

  unlinkDepartment: async (
    projectId: string,
    departmentId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${projectId}/departments/${departmentId}`);
    return response.data;
  },
};
