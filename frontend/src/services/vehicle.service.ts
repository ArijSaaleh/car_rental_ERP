import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';
import {
  Vehicle,
  VehicleFormData,
  VehicleListResponse,
  VehicleStats,
  VehicleStatus,
} from '../types';

// Vehicle service
export const vehicleService = {
  // Get all vehicles with pagination and filters
  getVehicles: async (
    page: number = 1,
    pageSize: number = 20,
    status?: VehicleStatus,
    brand?: string,
    search?: string
  ): Promise<VehicleListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    if (status) params.append('status', status);
    if (brand) params.append('brand', brand);
    if (search) params.append('search', search);

    const response = await apiClient.get<VehicleListResponse>(
      `${API_ENDPOINTS.VEHICLES}?${params.toString()}`
    );
    return response.data;
  },

  // Get vehicle by ID
  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await apiClient.get<Vehicle>(
      `${API_ENDPOINTS.VEHICLES}/${id}`
    );
    return response.data;
  },

  // Create vehicle
  createVehicle: async (data: VehicleFormData): Promise<Vehicle> => {
    const response = await apiClient.post<Vehicle>(
      API_ENDPOINTS.VEHICLES,
      data
    );
    return response.data;
  },

  // Update vehicle
  updateVehicle: async (
    id: string,
    data: Partial<VehicleFormData>
  ): Promise<Vehicle> => {
    const response = await apiClient.put<Vehicle>(
      `${API_ENDPOINTS.VEHICLES}/${id}`,
      data
    );
    return response.data;
  },

  // Delete vehicle
  deleteVehicle: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.VEHICLES}/${id}`);
  },

  // Get vehicle statistics
  getVehicleStats: async (): Promise<VehicleStats> => {
    const response = await apiClient.get<VehicleStats>(
      API_ENDPOINTS.VEHICLE_STATS
    );
    return response.data;
  },
};
