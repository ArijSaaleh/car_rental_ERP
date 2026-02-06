import api from './api';
import type { Booking, BookingCreate, BookingUpdate } from '../types';

export const bookingService = {
  async getAll(agencyId?: string, status?: string, vehicleId?: string, customerId?: string): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (agencyId) params.append('agencyId', agencyId);
    if (status) params.append('status', status);
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (customerId) params.append('customerId', customerId);
    
    const response = await api.get<Booking[]>(`/bookings?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Booking> {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  async create(booking: BookingCreate): Promise<Booking> {
    const response = await api.post<Booking>('/bookings', booking);
    return response.data;
  },

  async update(id: string, booking: BookingUpdate): Promise<Booking> {
    const response = await api.patch<Booking>(`/bookings/${id}`, booking);
    return response.data;
  },

  async cancel(id: string, reason?: string): Promise<void> {
    await api.post(`/bookings/${id}/cancel`, { reason });
  },

  async checkAvailability(vehicleId: string, startDate: string, endDate: string): Promise<{
    available: boolean;
    conflicts?: any[];
    pricing?: any;
  }> {
    const response = await api.post('/bookings/check-availability', {
      vehicleId,
      startDate,
      endDate,
    });
    return response.data;
  },

  async confirm(bookingId: string): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${bookingId}/confirm`);
    return response.data;
  },

  async start(bookingId: string, data: { initialMileage: number; initialFuelLevel: string }): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${bookingId}/start`, {
      initialMileage: data.initialMileage,
      initialFuelLevel: data.initialFuelLevel,
    });
    return response.data;
  },

  async complete(bookingId: string, data: { finalMileage: number; finalFuelLevel: string }): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${bookingId}/complete`, {
      finalMileage: data.finalMileage,
      finalFuelLevel: data.finalFuelLevel,
    });
    return response.data;
  },
};


