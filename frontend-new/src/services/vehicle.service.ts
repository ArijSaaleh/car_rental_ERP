import api from './api';
import type { Vehicle } from '../types';

export const vehicleService = {
  async getAll(agencyId?: string): Promise<Vehicle[]> {
    const params = agencyId ? `?agencyId=${agencyId}` : '';
    const response = await api.get<Vehicle[]>(`/vehicles${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Vehicle> {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  async create(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const response = await api.post<Vehicle>('/vehicles', vehicle);
    return response.data;
  },

  async update(id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.patch<Vehicle>(`/vehicles/${id}`, vehicle);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },

  async getStatistics(agencyId?: string): Promise<any> {
    const params = agencyId ? `?agencyId=${agencyId}` : '';
    const response = await api.get(`/vehicles/statistics${params}`);
    return response.data;
  },

  async checkAvailability(id: string, startDate: string, endDate: string): Promise<any> {
    const response = await api.get(`/vehicles/${id}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },
};
