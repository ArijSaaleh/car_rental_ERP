import api from './api';
import type { AuthResponse, LoginCredentials, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    });

    // Store both access and refresh tokens
    if (response.data.accessToken) {
      localStorage.setItem('access_token', response.data.accessToken);
    }

    if (response.data.refreshToken) {
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }

    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    // Ensure we have a token before making the request
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await api.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async logout() {
    try {
      // Call backend logout endpoint to invalidate tokens
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getCurrentUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
