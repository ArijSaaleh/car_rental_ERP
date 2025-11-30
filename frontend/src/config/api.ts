// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
  
  // Vehicles (Fleet Management)
  VEHICLES: `${API_BASE_URL}/api/v1/vehicles`,
  VEHICLE_STATS: `${API_BASE_URL}/api/v1/vehicles/stats`,
};

export default API_BASE_URL;
