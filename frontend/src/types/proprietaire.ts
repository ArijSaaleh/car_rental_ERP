// Proprietaire Dashboard Types

// User Management Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'super_admin' | 'proprietaire' | 'manager' | 'employee';
  is_active: boolean;
  agency_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'manager' | 'employee';
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

export interface UserChangeRole {
  new_role: 'manager' | 'employee';
}

export interface UserResetPassword {
  new_password: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  users_by_role?: {
    [key: string]: number;
  };
}

// Agency Settings Types
export interface Agency {
  id: string;
  owner_id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  legal_name: string;
  subscription_plan: string;
  subscription_start_date: string;
  subscription_end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  available_features: string[];
  users_count?: number;
  vehicles_count?: number;
  bookings_count?: number;
  total_revenue?: number;
}

export interface AgencyCreate {
  name: string;
  legal_name: string;
  tax_id: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country?: string;
  subscription_plan?: string;
}

export interface AgencyListItem {
  id: string;
  name: string;
  city: string;
  subscription_plan: string;
  is_active: boolean;
  managers_count: number;
  users_count: number;
  vehicles_count: number;
}

export interface AgencyUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  legal_name?: string;
}

export interface SubscriptionInfo {
  current_plan: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  is_active: boolean;
  available_features: string[];
  plan_comparison?: {
    [key: string]: PlanDetails;
  };
}

export interface PlanDetails {
  name: string;
  features: string[];
  max_users: number | null;
  max_vehicles: number | null;
  price_monthly: number;
}

export interface FeatureCheck {
  feature: string;
  has_access: boolean;
  required_plan: string | null;
}

export interface AgencyStatistics {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  vehicles: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  customers: {
    total: number;
    individuals: number;
    companies: number;
  };
  bookings: {
    total: number;
    active: number;
    completed: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
  subscription: {
    plan: string;
    days_remaining: number;
    is_active: boolean;
  };
}

// Customer Management Types
export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  customer_type: 'individual' | 'company';
  cin_number: string | null;
  license_number: string;
  company_name: string | null;
  company_tax_id: string | null;
  agency_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  address?: string;
  city?: string;
  customer_type: 'individual' | 'company';
  cin_number?: string;
  company_name?: string;
  company_tax_id?: string;
}

export interface CustomerUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  address?: string;
  city?: string;
  customer_type?: 'individual' | 'company';
  cin_number?: string;
  company_name?: string;
  company_tax_id?: string;
}

export interface CustomerStats {
  total_customers: number;
  individuals: number;
  companies: number;
}

// Multi-Agency Types
export interface MultiAgencyStats {
  total_agencies: number;
  active_agencies: number;
  total_users: number;
  total_vehicles: number;
  total_customers: number;
  total_bookings: number;
  total_revenue: number;
  agencies: AgencySummary[];
}

export interface AgencySummary {
  id: string;
  name: string;
  city: string;
  plan: string;
  is_active: boolean;
  users_count: number;
  vehicles_count: number;
  customers_count: number;
  bookings_count: number;
  revenue: number;
  managers: ManagerInfo[];
}

export interface ManagerInfo {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export interface ManagerCreate {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  agency_id: string;
}

// Common Types
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
