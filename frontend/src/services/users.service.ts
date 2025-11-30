import axios from 'axios';
import {
  User,
  UserCreate,
  UserUpdate,
  UserChangeRole,
  UserResetPassword,
  UserStats,
  PaginationParams,
} from '../types/proprietaire';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const usersService = {
  // List users
  async getUsers(params?: { role?: string; is_active?: boolean } & PaginationParams): Promise<User[]> {
    const response = await axios.get(`${API_URL}/users/`, {
      headers: getAuthHeader(),
      params,
    });
    return response.data;
  },

  // Get user details
  async getUser(userId: string): Promise<User> {
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Create user
  async createUser(data: UserCreate): Promise<User> {
    const response = await axios.post(`${API_URL}/users/`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Update user
  async updateUser(userId: string, data: UserUpdate): Promise<User> {
    const response = await axios.put(`${API_URL}/users/${userId}`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Delete (deactivate) user
  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/users/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Activate user
  async activateUser(userId: string): Promise<User> {
    const response = await axios.patch(`${API_URL}/users/${userId}/activate`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Change user role
  async changeUserRole(userId: string, data: UserChangeRole): Promise<User> {
    const response = await axios.patch(`${API_URL}/users/${userId}/change-role`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Reset user password
  async resetUserPassword(userId: string, data: UserResetPassword): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/users/${userId}/reset-password`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response = await axios.get(`${API_URL}/users/stats/summary`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
