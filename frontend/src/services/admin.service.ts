import apiClient from './api';
import {
  PlatformStats,
  AgencyHealthStatus,
  AgencyDetails,
  AgencyOnboardingRequest,
  AuditLogEntry,
  AuditLogFilter,
  PlatformRevenueReport,
  SubscriptionChangeRequest,
  BulkOperationResult,
} from '../types/admin';

const BASE_URL = '/api/v1/admin';

export const adminService = {
  // Platform Statistics
  getPlatformStats: async (): Promise<PlatformStats> => {
    const response = await apiClient.get<PlatformStats>(`${BASE_URL}/statistics`);
    return response.data;
  },

  // Agency Management
  getAgencies: async (params?: {
    skip?: number;
    limit?: number;
    subscription_plan?: string;
    is_active?: boolean;
  }): Promise<AgencyDetails[]> => {
    const response = await apiClient.get<AgencyDetails[]>(`${BASE_URL}/agencies`, { params });
    return response.data;
  },

  getAgencyDetails: async (agencyId: string): Promise<AgencyDetails> => {
    const response = await apiClient.get<AgencyDetails>(`${BASE_URL}/agencies/${agencyId}`);
    return response.data;
  },

  onboardAgency: async (data: AgencyOnboardingRequest): Promise<AgencyDetails> => {
    const response = await apiClient.post<AgencyDetails>(`${BASE_URL}/agencies/onboard`, data);
    return response.data;
  },

  toggleAgencyStatus: async (agencyId: string, reason?: string): Promise<AgencyDetails> => {
    const response = await apiClient.patch<AgencyDetails>(
      `${BASE_URL}/agencies/${agencyId}/toggle-status`,
      { reason }
    );
    return response.data;
  },

  // Health Monitoring
  getAgenciesHealth: async (): Promise<AgencyHealthStatus[]> => {
    const response = await apiClient.get<AgencyHealthStatus[]>(`${BASE_URL}/agencies/health`);
    return response.data;
  },

  // Subscription Management
  changeSubscription: async (data: SubscriptionChangeRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `${BASE_URL}/subscriptions/change`,
      data
    );
    return response.data;
  },

  // Bulk Operations
  bulkDeactivateAgencies: async (agencyIds: string[], reason: string): Promise<BulkOperationResult> => {
    const response = await apiClient.post<BulkOperationResult>(
      `${BASE_URL}/bulk/deactivate-agencies`,
      { agency_ids: agencyIds, reason }
    );
    return response.data;
  },

  // Revenue Analytics
  getRevenueReport: async (startDate?: string, endDate?: string): Promise<PlatformRevenueReport> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await apiClient.get<PlatformRevenueReport>(`${BASE_URL}/revenue/report`, { params });
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (filter: AuditLogFilter): Promise<AuditLogEntry[]> => {
    const response = await apiClient.post<AuditLogEntry[]>(`${BASE_URL}/audit-logs`, filter);
    return response.data;
  },

  // User Management
  getAllUsers: async (params?: {
    skip?: number;
    limit?: number;
    role?: string;
    agency_id?: string;
  }): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`${BASE_URL}/users/all`, { params });
    return response.data;
  },

  createAgencyOwner: async (data: {
    agency_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }): Promise<any> => {
    const response = await apiClient.post<any>(`${BASE_URL}/users/create-owner`, data);
    return response.data;
  },
};
