// Super Admin Types
export interface PlatformStats {
  total_agencies: number;
  active_agencies: number;
  total_users: number;
  total_vehicles: number;
  total_bookings: number;
  total_revenue: number;
  revenue_by_plan: {
    [key: string]: number;
  };
  agencies_by_plan: {
    [key: string]: number;
  };
}

export interface AgencyHealthStatus {
  agency_id: string;
  agency_name: string;
  health_score: number;
  is_active: boolean;
  subscription_plan: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  total_users: number;
  total_vehicles: number;
  active_bookings: number;
  last_activity: string | null;
  issues: string[];
}

export interface AgencyDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  is_active: boolean;
  subscription_plan: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  subscription_start_date: string;
  subscription_end_date: string;
  created_at: string;
  users_count: number;
  vehicles_count: number;
  bookings_count: number;
  total_revenue: number;
}

export interface AgencyOnboardingRequest {
  agency_name: string;
  agency_email: string;
  agency_phone: string;
  agency_address: string;
  agency_city: string;
  agency_country: string;
  subscription_plan: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
}

export interface AuditLogEntry {
  id: string;
  admin_email: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilter {
  admin_email?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface RevenueReportItem {
  agency_id: string;
  agency_name: string;
  subscription_plan: string;
  total_revenue: number;
  payment_count: number;
}

export interface PlatformRevenueReport {
  total_revenue: number;
  period_start: string;
  period_end: string;
  agencies: RevenueReportItem[];
}

export interface SubscriptionChangeRequest {
  agency_id: string;
  new_plan: 'TRIAL' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  reason: string;
}

export interface BulkOperationResult {
  success_count: number;
  failure_count: number;
  errors: Array<{
    agency_id: string;
    error: string;
  }>;
}
