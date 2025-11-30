import axios from 'axios';
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerStats,
  PaginationParams,
} from '../types/proprietaire';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const customersService = {
  // List customers
  async getCustomers(params?: { customer_type?: string; search?: string } & PaginationParams): Promise<Customer[]> {
    const response = await axios.get(`${API_URL}/customers/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  },

  // Get customer details
  async getCustomer(customerId: number): Promise<Customer> {
    const response = await axios.get(`${API_URL}/customers/${customerId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Create customer
  async createCustomer(data: CustomerCreate): Promise<Customer> {
    const response = await axios.post(`${API_URL}/customers/`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Update customer
  async updateCustomer(customerId: number, data: CustomerUpdate): Promise<Customer> {
    const response = await axios.put(`${API_URL}/customers/${customerId}`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Delete customer
  async deleteCustomer(customerId: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/customers/${customerId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get customer statistics
  async getCustomerStats(): Promise<CustomerStats> {
    const response = await axios.get(`${API_URL}/customers/stats/summary`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
