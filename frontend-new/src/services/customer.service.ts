import api from './api';
import type { Customer } from '../types';

export const customerService = {
  async getAll(agencyId?: string): Promise<Customer[]> {
    const params = agencyId ? `?agency_id=${agencyId}` : '';
    const response = await api.get<Customer[]>(`/customers${params}`);
    return response.data;
  },

  async getById(id: number): Promise<Customer> {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const response = await api.post<Customer>('/customers', customer);
    return response.data;
  },

  async update(id: number, customer: Partial<Customer>): Promise<Customer> {
    const response = await api.put<Customer>(`/customers/${id}`, customer);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};
