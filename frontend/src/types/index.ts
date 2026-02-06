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
  contractNumber: string;
  agencyId: string;
  bookingId: number;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pdfUrl?: string;
  pdfStoragePath?: string;
  pdfGeneratedAt?: string;
  customerSignatureData?: string;
  customerSignedAt?: string;
  customerIpAddress?: string;
  agentSignatureData?: string;
  agentSignedAt?: string;
  agentId?: string;
  termsAndConditions: string;
  customerAcceptedTerms: boolean;
  acceptedTermsAt?: string;
  specialClauses?: any;
  timbreFiscalAmount: string;
  contractLanguage: string;
  createdAt: string;
  updatedAt?: string;
  booking?: Booking;
}

export interface Payment {
  id: number;
  paymentReference: string;
  agencyId: string;
  bookingId: number;
  invoiceId?: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'MOBILE_PAYMENT';
  paymentType: 'RENTAL_FEE' | 'DEPOSIT' | 'EXCESS_CHARGE' | 'DAMAGE_CHARGE' | 'LATE_FEE' | 'REFUND';
  amount: string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  gateway?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  gatewayFee?: string;
  webhookReceivedAt?: string;
  callbackUrl?: string;
  cardLast4?: string;
  cardBrand?: string;
  description?: string;
  paymentMetadata?: any;
  processedByUserId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
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
