import api from './api';
import type { Customer } from '../types';

export const customerService = {
  async getAll(agencyId?: string): Promise<Customer[]> {
    const params = agencyId ? `?agencyId=${agencyId}` : '';
    const response = await api.get<Customer[]>(`/customers${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await api.post<Customer>('/customers', customer);
    return response.data;
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await api.patch<Customer>(`/customers/${id}`, customer);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
