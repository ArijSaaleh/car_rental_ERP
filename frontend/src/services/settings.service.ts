import api from './api';

export interface SystemSettings {
  [key: string]: any;
}

export const settingsService = {
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get<SystemSettings>('/settings');
    return response.data;
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.post<SystemSettings>('/settings', settings);
    return response.data;
  },
};
