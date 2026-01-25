import api from './api';
import type { Agency } from '../types';

export const agencyService = {
  async getAll(): Promise<Agency[]> {
    const response = await api.get<Agency[]>('/agencies');
    return response.data;
  },

  async getById(id: string): Promise<Agency> {
    const response = await api.get<Agency>(`/agencies/${id}`);
    return response.data;
  },

  async create(agency: Omit<Agency, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agency> {
    const response = await api.post<Agency>('/agencies', agency);
    return response.data;
  },

  async update(id: string, agency: Partial<Agency>): Promise<Agency> {
    const response = await api.patch<Agency>(`/agencies/${id}`, agency);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/agencies/${id}`);
  },
};
