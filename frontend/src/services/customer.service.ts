import api from './api';
import type { Customer, Booking } from '../types';

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
    // Transform frontend field names to match backend DTO
    const createDto: any = {
      fullName: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      phoneNumber: customer.phone,
    };
    
    if (customer.address) createDto.address = customer.address;
    if (customer.city) createDto.city = customer.city;
    if (customer.country) createDto.country = customer.country;
    if (customer.dateOfBirth) createDto.dateOfBirth = customer.dateOfBirth;
    if (customer.cinNumber) createDto.idCardNumber = customer.cinNumber;
    if (customer.licenseNumber) createDto.driverLicenseNumber = customer.licenseNumber;
    if (customer.licenseExpiryDate) createDto.licenseExpiryDate = customer.licenseExpiryDate;
    
    const response = await api.post<Customer>('/customers', createDto);
    return response.data;
  },

  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    // Transform frontend field names to match backend DTO
    const updateDto: any = {};
    
    if (customer.firstName || customer.lastName) {
      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
      if (fullName) updateDto.fullName = fullName;
    }
    if (customer.email) updateDto.email = customer.email;
    if (customer.phone) updateDto.phoneNumber = customer.phone;
    if (customer.address) updateDto.address = customer.address;
    if (customer.city) updateDto.city = customer.city;
    if (customer.country) updateDto.country = customer.country;
    if (customer.dateOfBirth) updateDto.dateOfBirth = customer.dateOfBirth;
    if (customer.cinNumber) updateDto.idCardNumber = customer.cinNumber;
    if (customer.licenseNumber) updateDto.driverLicenseNumber = customer.licenseNumber;
    if (customer.licenseExpiryDate) updateDto.licenseExpiryDate = customer.licenseExpiryDate;
    
    const response = await api.patch<Customer>(`/customers/${id}`, updateDto);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  async getBookings(id: string): Promise<Booking[]> {
    const response = await api.get<Booking[]>(`/customers/${id}/bookings`);
    return response.data;
  },

  async toggleBlacklist(id: string, isBlacklisted: boolean, reason?: string): Promise<Customer> {
    const response = await api.put<Customer>(`/customers/${id}/blacklist`, {
      isBlacklisted,
      reason,
    });
    return response.data;
  },
};
