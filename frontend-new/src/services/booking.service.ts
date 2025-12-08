import api from './api';
import type { Booking } from '../types';

export const bookingService = {
  async getAll(): Promise<Booking[]> {
    const response = await api.get<Booking[]>('/bookings');
    return response.data;
  },

  async getById(id: number): Promise<Booking> {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  async create(booking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
    const response = await api.post<Booking>('/bookings', booking);
    return response.data;
  },

  async update(id: number, booking: Partial<Booking>): Promise<Booking> {
    const response = await api.put<Booking>(`/bookings/${id}`, booking);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/bookings/${id}`);
  },

  async updateStatus(id: number, statut: string): Promise<Booking> {
    const response = await api.put<Booking>(`/bookings/${id}`, { statut });
    return response.data;
  },
};
