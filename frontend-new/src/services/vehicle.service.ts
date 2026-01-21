import api from './api';
import type { Vehicle } from '../types';

export const vehicleService = {
  async getAll(agencyId?: string): Promise<Vehicle[]> {
    const params = agencyId ? `?agency_id=${agencyId}` : '';
    const response = await api.get<Vehicle[]>(`/vehicles${params}`);
    return response.data;
  },

  async getById(id: number): Promise<Vehicle> {
    const response = await api.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  },

  async create(vehicle: Omit<Vehicle, 'id' | 'created_at'>): Promise<Vehicle> {
    const response = await api.post<Vehicle>('/vehicles', vehicle);
    return response.data;
  },

  async update(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put<Vehicle>(`/vehicles/${id}`, vehicle);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },
};
