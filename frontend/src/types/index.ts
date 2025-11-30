// User roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  PROPRIETAIRE = 'proprietaire',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

// Vehicle status
export enum VehicleStatus {
  DISPONIBLE = 'disponible',
  LOUE = 'loue',
  MAINTENANCE = 'maintenance',
  HORS_SERVICE = 'hors_service',
}

// Fuel types
export enum FuelType {
  ESSENCE = 'essence',
  DIESEL = 'diesel',
  HYBRIDE = 'hybride',
  ELECTRIQUE = 'electrique',
}

// Transmission types
export enum TransmissionType {
  MANUELLE = 'manuelle',
  AUTOMATIQUE = 'automatique',
}

// User interface
export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  agency_id?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Token response
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Vehicle interface
export interface Vehicle {
  id: string;
  agency_id: string;
  license_plate: string;
  vin?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  seats: number;
  doors: number;
  mileage: number;
  status: VehicleStatus;
  registration_number?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  technical_control_expiry?: string;
  daily_rate?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Vehicle create/update interface
export interface VehicleFormData {
  license_plate: string;
  vin?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuel_type: FuelType;
  transmission: TransmissionType;
  seats: number;
  doors: number;
  mileage: number;
  status: VehicleStatus;
  registration_number?: string;
  insurance_policy?: string;
  insurance_expiry?: string;
  technical_control_expiry?: string;
  daily_rate?: number;
  notes?: string;
}

// Vehicle list response
export interface VehicleListResponse {
  total: number;
  vehicles: Vehicle[];
  page: number;
  page_size: number;
}

// Vehicle statistics
export interface VehicleStats {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  out_of_service: number;
  utilization_rate: number;
}

// Re-export admin types
export * from './admin';
