import api from './api';

export interface SlackConfig {
  id: string;
  projectId: string;
  webhookUrl: string;
  dailyEnabled: boolean;
  weeklyEnabled: boolean;
  managerWebhookUrl: string | null;
  memberWebhookUrl: string | null;
}

export interface SaveSlackConfigData {
  webhookUrl: string;
  dailyEnabled?: boolean;
  weeklyEnabled?: boolean;
  managerWebhookUrl?: string | null;
  memberWebhookUrl?: string | null;
}

export const slackConfigService = {
  get: async (projectId: string): Promise<SlackConfig | null> => {
    const res = await api.get<{ success: boolean; data: SlackConfig | null }>(`/projects/${projectId}/slack-config`);
    return res.data.data;
  },

  save: async (projectId: string, data: SaveSlackConfigData): Promise<SlackConfig> => {
    const res = await api.put<{ success: boolean; data: SlackConfig }>(`/projects/${projectId}/slack-config`, data);
    return res.data.data;
  },

  remove: async (projectId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/slack-config`);
  },

  test: async (projectId: string): Promise<void> => {
    await api.post(`/projects/${projectId}/slack-config/test`);
  },
};
