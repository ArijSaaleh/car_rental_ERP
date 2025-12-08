import api from './api';
import type { Payment } from '../types';

export const paymentService = {
  async getAll(): Promise<Payment[]> {
    const response = await api.get<Payment[]>('/payments');
    return response.data;
  },

  async getById(id: number): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`);
    return response.data;
  },

  async create(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const response = await api.post<Payment>('/payments', payment);
    return response.data;
  },

  async update(id: number, payment: Partial<Payment>): Promise<Payment> {
    const response = await api.put<Payment>(`/payments/${id}`, payment);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/payments/${id}`);
  },
};
