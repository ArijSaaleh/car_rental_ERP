import api from './api';
import type { Agency } from '../types';

export const agencyService = {
  async getAll(): Promise<Agency[]> {
    const response = await api.get<Agency[]>('/agency');
    return response.data;
  },

  async getById(id: number): Promise<Agency> {
    const response = await api.get<Agency>(`/agency/${id}`);
    return response.data;
  },

  async create(agency: Omit<Agency, 'id' | 'created_at'>): Promise<Agency> {
    const response = await api.post<Agency>('/agency', agency);
    return response.data;
  },

  async update(id: number, agency: Partial<Agency>): Promise<Agency> {
    const response = await api.put<Agency>(`/agency/${id}`, agency);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/agency/${id}`);
  },
};
