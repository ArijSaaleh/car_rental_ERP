import api from './api';
import type { User } from '../types';

export const userService = {
  async getAll(agencyId?: string): Promise<User[]> {
    const params = agencyId ? `?agencyId=${agencyId}` : '';
    const response = await api.get<User[]>(`/users${params}`);
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
