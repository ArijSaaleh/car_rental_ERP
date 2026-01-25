// Core Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'PROPRIETAIRE' | 'MANAGER' | 'AGENT_COMPTOIR' | 'AGENT_PARC' | 'CLIENT';
  agencyId?: string;
  agency?: Agency;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Agency {
  id: string;
  ownerId?: string;
  parentAgencyId?: string;
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  subscriptionPlan: 'BASIQUE' | 'STANDARD' | 'PREMIUM' | 'ENTREPRISE';
  subscriptionStatus?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isActive: boolean;
  currency?: string;
  language?: string;
  timezone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  agencyId: string;
  licensePlate: string;
  vin?: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE';
  transmission: 'MANUELLE' | 'AUTOMATIQUE';
  seats: number;
  doors: number;
  mileage: number;
  status: 'DISPONIBLE' | 'LOUE' | 'MAINTENANCE' | 'HORS_SERVICE';
  registrationNumber?: string;
  registrationExpiry?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  technicalControlExpiry?: string;
  dailyRate: string;
  depositAmount?: string;
  features?: string[];
  images?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  agencyId: string;
  customerType?: 'INDIVIDUAL' | 'COMPANY';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cinNumber?: string;
  cinIssueDate?: string;
  cinExpiryDate?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  licenseNumber: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  licenseCategory?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  agencyId: string;
  vehicleId: string;
  customerId: string;
  createdByUserId: string;
  startDate: string;
  endDate: string;
  pickupDatetime?: string;
  returnDatetime?: string;
  dailyRate: string;
  durationDays: number;
  subtotal: string;
  taxAmount?: string;
  timbreFiscal?: string;
  totalAmount: string;
  depositAmount: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  initialMileage?: number;
  finalMileage?: number;
  mileageLimit?: number;
  extraMileageRate?: string;
  initialFuelLevel?: string;
  finalFuelLevel?: string;
  fuelPolicy?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface BookingCreate {
  vehicleId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  dailyRate?: string;
  depositAmount?: string;
  mileageLimit?: number;
  extraMileageRate?: string;
  fuelPolicy?: string;
  notes?: string;
}

export interface BookingUpdate {
  startDate?: string;
  endDate?: string;
  status?: string;
  paymentStatus?: string;
  initialMileage?: number;
  finalMileage?: number;
  initialFuelLevel?: string;
  finalFuelLevel?: string;
  notes?: string;
  cancellationReason?: string;
}

export interface Contract {
  id: number;
  reservation_id: number;
  reservation?: Booking;
  numero_contrat: string;
  date_debut: string;
  date_fin: string;
  date_signature: string;
  conditions: string;
  caution: number;
  franchise: number;
  kilometrage_inclus: number;
  prix_km_supplementaire: number;
  depot_garantie: number;
  statut: 'en_attente' | 'actif' | 'termine' | 'annule';
  created_at: string;
}

export interface Payment {
  id: number;
  contrat_id: number;
  contrat?: Contract;
  reservation_id?: number;
  reservation?: Booking;
  montant: number;
  mode_paiement: 'especes' | 'carte_bancaire' | 'cheque' | 'virement';
  type_paiement: 'location' | 'caution' | 'franchise' | 'km_supplementaire';
  statut: 'en_attente' | 'effectue' | 'rembourse' | 'annule';
  date_paiement: string;
  reference: string;
  created_at: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiError {
  detail: string | Array<{
    type: string;
    loc: string[];
    msg: string;
    input: any;
  }>;
}
