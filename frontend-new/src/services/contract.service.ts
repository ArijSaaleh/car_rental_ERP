import api from './api';
import type { Contract } from '../types';

export const contractService = {
  async getAll(): Promise<Contract[]> {
    const response = await api.get<Contract[]>('/contracts');
    return response.data;
  },

  async getById(id: string): Promise<Contract> {
    const response = await api.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  async create(contract: Omit<Contract, 'id' | 'createdAt'>): Promise<Contract> {
    const response = await api.post<Contract>('/contracts', contract);
    return response.data;
  },

  async update(id: string, contract: Partial<Contract>): Promise<Contract> {
    const response = await api.patch<Contract>(`/contracts/${id}`, contract);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/contracts/${id}`);
  },

  async updateStatus(id: string, status: string): Promise<Contract> {
    const response = await api.patch<Contract>(`/contracts/${id}`, { status });
    return response.data;
  },
};
