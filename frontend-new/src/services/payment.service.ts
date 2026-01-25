import api from './api';
import type { Payment } from '../types';

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments');
    return response.data;
  },

  async getById(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  async create(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const response = await api.post<Payment>('/payments', payment);
    return response.data;
  },

  async update(id: string, payment: Partial<Payment>): Promise<Payment> {
    const response = await api.patch<Payment>(`/payments/${id}`, payment);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/payments/${id}`);
  },
};
