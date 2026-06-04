import api from './api';

export interface SlackConfig {
  id: string;
  projectId: string;
  webhookUrl: string;
  dailyEnabled: boolean;
  weeklyEnabled: boolean;
  managerWebhookUrl: string | null;
  memberWebhookUrl: string | null;
  timezone: string;
  dailyTime: string;
  weeklyDay: number;
  weeklyTime: string;
  lastDailySentKey: string | null;
  lastWeeklySentKey: string | null;
}

export interface SaveSlackConfigData {
  webhookUrl: string;
  dailyEnabled?: boolean;
  weeklyEnabled?: boolean;
  managerWebhookUrl?: string | null;
  memberWebhookUrl?: string | null;
  timezone?: string;
  dailyTime?: string;
  weeklyDay?: number;
  weeklyTime?: string;
}

export interface WebhookSecretInfo {
  hasSecret: boolean;
  masked: string | null;
}

export interface RegeneratedSecret {
  secret: string;
  masked: string;
}

// EmojiMappings: canonical names as keys (no colons), profileId as values
export type EmojiMappings = Record<string, string>;

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

  test: async (projectId: string, type: 'daily' | 'weekly'): Promise<void> => {
    await api.post(`/projects/${projectId}/slack-config/test`, { type });
  },

  getEmojiMappings: async (projectId: string): Promise<EmojiMappings | null> => {
    const res = await api.get<{ success: boolean; data: EmojiMappings | null }>(`/projects/${projectId}/slack-config/emoji-mappings`);
    return res.data.data;
  },

  saveEmojiMappings: async (projectId: string, mappings: EmojiMappings): Promise<EmojiMappings | null> => {
    const res = await api.put<{ success: boolean; data: EmojiMappings | null }>(`/projects/${projectId}/slack-config/emoji-mappings`, { mappings });
    return res.data.data;
  },

  getWebhookSecretInfo: async (projectId: string): Promise<WebhookSecretInfo> => {
    const res = await api.get<{ success: boolean; data: WebhookSecretInfo }>(`/projects/${projectId}/slack-config/webhook-secret`);
    return res.data.data;
  },

  regenerateWebhookSecret: async (projectId: string): Promise<RegeneratedSecret> => {
    const res = await api.post<{ success: boolean; data: RegeneratedSecret }>(`/projects/${projectId}/slack-config/webhook-secret/regenerate`, {});
    return res.data.data;
  },
};
