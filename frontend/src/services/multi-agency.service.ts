import axios from 'axios';
import { 
  Agency, 
  AgencyCreate, 
  AgencyListItem, 
  MultiAgencyStats,
  AgencySummary,
  ManagerCreate,
  ManagerInfo 
} from '../types/proprietaire';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

class MultiAgencyService {
  /**
   * Get all agencies owned by the current proprietaire
   */
  async getOwnedAgencies(): Promise<AgencyListItem[]> {
    const response = await axios.get(`${API_URL}/proprietaire/agencies`, getAuthHeader());
    return response.data;
  }

  /**
   * Get multi-agency statistics
   */
  async getMultiAgencyStats(): Promise<MultiAgencyStats> {
    const response = await axios.get(`${API_URL}/proprietaire/statistics`, getAuthHeader());
    return response.data;
  }

  /**
   * Get detailed information about a specific agency
   */
  async getAgencyDetails(agencyId: string): Promise<AgencySummary> {
    const response = await axios.get(`${API_URL}/proprietaire/agencies/${agencyId}`, getAuthHeader());
    return response.data;
  }

  /**
   * Create a new agency
   */
  async createAgency(data: AgencyCreate): Promise<Agency> {
    const response = await axios.post(`${API_URL}/proprietaire/agencies`, data, getAuthHeader());
    return response.data;
  }

  /**
   * Update agency information
   */
  async updateAgency(agencyId: string, data: Partial<AgencyCreate>): Promise<Agency> {
    const response = await axios.put(`${API_URL}/proprietaire/agencies/${agencyId}`, data, getAuthHeader());
    return response.data;
  }

  /**
   * Toggle agency active status
   */
  async toggleAgencyStatus(agencyId: string): Promise<Agency> {
    const response = await axios.post(`${API_URL}/proprietaire/agencies/${agencyId}/toggle-status`, {}, getAuthHeader());
    return response.data;
  }

  /**
   * Get managers for a specific agency
   */
  async getAgencyManagers(agencyId: string): Promise<ManagerInfo[]> {
    const response = await axios.get(`${API_URL}/proprietaire/agencies/${agencyId}/managers`, getAuthHeader());
    return response.data;
  }

  /**
   * Assign a new manager to an agency
   */
  async assignManager(data: ManagerCreate): Promise<ManagerInfo> {
    const response = await axios.post(`${API_URL}/proprietaire/agencies/${data.agency_id}/managers`, data, getAuthHeader());
    return response.data;
  }

  /**
   * Remove manager from agency
   */
  async removeManager(agencyId: string, managerId: string): Promise<void> {
    await axios.delete(`${API_URL}/proprietaire/agencies/${agencyId}/managers/${managerId}`, getAuthHeader());
  }

  /**
   * Switch context to a specific agency
   */
  async switchAgency(agencyId: string): Promise<void> {
    // Store selected agency in localStorage
    localStorage.setItem('selected_agency_id', agencyId);
  }

  /**
   * Get currently selected agency
   */
  getSelectedAgencyId(): string | null {
    return localStorage.getItem('selected_agency_id');
  }

  /**
   * Clear agency selection
   */
  clearSelectedAgency(): void {
    localStorage.removeItem('selected_agency_id');
  }
}

export const multiAgencyService = new MultiAgencyService();
