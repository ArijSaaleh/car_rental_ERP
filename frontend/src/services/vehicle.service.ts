import api from './api';
import type { Vehicle } from '../types';

export const vehicleService = {
  async getAll(params?: { agencyId?: string; page?: number; pageSize?: number; status?: string; brand?: string; search?: string }): Promise<Vehicle[]> {
    const queryParams = new URLSearchParams();
    if (params?.agencyId) queryParams.append('agencyId', params.agencyId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.brand) queryParams.append('brand', params.brand);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const url = `/vehicles${queryString ? `?${queryString}` : ''}`;
    const response = await api.get<any>(url);
    
    // Handle paginated response from backend
    if (response.data && response.data.vehicles) {
      return response.data.vehicles;
    }
    // Fallback to array response
    return Array.isArray(response.data) ? response.data : [];
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
