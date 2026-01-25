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
    await api.post(`/bookings/${id}/cancel`, { cancellationReason: reason });
  },

  async checkAvailability(vehicleId: number, startDate: string, endDate: string): Promise<{
    available: boolean;
    conflicts?: any[];
    pricing?: any;
  }> {
    const response = await api.post('/bookings/check-availability', {
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
    });
    return response.data;
  },

  async getAvailableVehicles(startDate: string, endDate: string, filters?: {
    brand?: string;
    fuel_type?: string;
    transmission?: string;
    min_seats?: number;
  }): Promise<any[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const response = await api.get(`/bookings/available-vehicles?${params.toString()}`);
    return response.data;
  },

  async getVehicleCalendar(vehicleId: number, startDate: string, endDate: string): Promise<{
    vehicle_id: number;
    events: any[];
  }> {
    const response = await api.get(`/bookings/vehicle/${vehicleId}/calendar`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  async confirm(bookingId: number): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${bookingId}/confirm`);
    return response.data;
  },

  async startRental(bookingId: number, initialMileage: number, initialFuelLevel: string): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${bookingId}/start`, {
      initial_mileage: initialMileage,
      initial_fuel_level: initialFuelLevel,
    });
    return response.data;
  },

  async completeRental(bookingId: number, finalMileage: number, finalFuelLevel: string): Promise<Booking> {
    const response = await api.post<Booking>(`/bookings/${bookingId}/complete`, {
      final_mileage: finalMileage,
      final_fuel_level: finalFuelLevel,
    });
    return response.data;
  },

  async recordPayment(
    bookingId: number,
    amount: number,
    paymentMethod: string,
    paymentType: string,
    reference?: string,
    notes?: string
  ): Promise<any> {
    const response = await api.post(`/bookings/${bookingId}/payment`, null, {
      params: {
        amount,
        payment_method: paymentMethod,
        payment_type: paymentType,
        reference,
        notes,
      },
    });
    return response.data;
  },

  async getPaymentSummary(bookingId: number): Promise<{
    booking_id: number;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    deposit_amount: number;
    payment_status: string;
    timbre_fiscal: number;
    tax_amount: number;
  }> {
    const response = await api.get(`/bookings/${bookingId}/payment-summary`);
    return response.data;
  },
};


