import api from './api';
import type { Contract } from '../types';

export const contractService = {
  async getAll(): Promise<Contract[]> {
    const response = await api.get<Contract[]>('/contracts');
    return response.data;
  },

  async getById(id: number): Promise<Contract> {
    const response = await api.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  async create(contract: Omit<Contract, 'id' | 'created_at'>): Promise<Contract> {
    const response = await api.post<Contract>('/contracts', contract);
    return response.data;
  },

  async update(id: number, contract: Partial<Contract>): Promise<Contract> {
    const response = await api.put<Contract>(`/contracts/${id}`, contract);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/contracts/${id}`);
  },

  async updateStatus(id: number, statut: string): Promise<Contract> {
    const response = await api.put<Contract>(`/contracts/${id}`, { statut });
    return response.data;
  },
};
