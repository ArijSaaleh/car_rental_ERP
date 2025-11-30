import axios from 'axios';
import {
  Agency,
  AgencyUpdate,
  SubscriptionInfo,
  FeatureCheck,
  AgencyStatistics,
} from '../types/proprietaire';

const API_URL = 'http://localhost:8000/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const agencyService = {
  // Get current agency
  async getAgency(): Promise<Agency> {
    const response = await axios.get(`${API_URL}/agency/me`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Update agency
  async updateAgency(data: AgencyUpdate): Promise<Agency> {
    const response = await axios.put(`${API_URL}/agency/me`, data, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get subscription info
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const response = await axios.get(`${API_URL}/agency/subscription/info`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Check feature access
  async checkFeature(feature: string): Promise<FeatureCheck> {
    const response = await axios.get(`${API_URL}/agency/features/check/${feature}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get agency statistics
  async getStatistics(): Promise<AgencyStatistics> {
    const response = await axios.get(`${API_URL}/agency/statistics`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },
};
