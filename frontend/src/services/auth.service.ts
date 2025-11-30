import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';
import { LoginCredentials, TokenResponse, User } from '../types';

// Authentication service
export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.LOGOUT);
    localStorage.removeItem('access_token');
  },

  // Get current user (you would need to implement this endpoint in backend)
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },

  // Store token
  storeToken: (token: string): void => {
    localStorage.setItem('access_token', token);
  },

  // Get token
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};
