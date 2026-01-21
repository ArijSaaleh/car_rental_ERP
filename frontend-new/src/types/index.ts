// Core Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'proprietaire' | 'manager' | 'agent_comptoir' | 'agent_parc' | 'client';
  agency_id?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

export interface Agency {
  id: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  proprietaire_id: number;
  proprietaire?: User;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: number;
  agence_id: number;
  agence?: Agency;
  matricule: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  type_carburant: string;
  kilometrage: number;
  prix_journalier: number;
  statut: 'disponible' | 'loue' | 'maintenance';
  image_url?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  agence_id: number;
  agence?: Agency;
  nom: string;
  prenom: string;
  cin: string;
  email: string;
  telephone: string;
  adresse: string;
  date_naissance: string;
  num_permis: string;
  date_permis: string;
  created_at: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  agency_id: number;
  vehicle_id: number;
  customer_id: number;
  created_by_user_id: number;
  start_date: string;
  end_date: string;
  pickup_datetime?: string;
  return_datetime?: string;
  daily_rate: number;
  duration_days: number;
  subtotal: number;
  tax_amount: number;
  timbre_fiscal: number;
  total_amount: number;
  deposit_amount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  initial_mileage?: number;
  final_mileage?: number;
  mileage_limit?: number;
  extra_mileage_rate?: number;
  initial_fuel_level?: string;
  final_fuel_level?: string;
  fuel_policy: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  vehicle?: Vehicle;
}

export interface BookingCreate {
  vehicle_id: number;
  customer_id: number;
  start_date: string;
  end_date: string;
  daily_rate?: number;
  deposit_amount?: number;
  mileage_limit?: number;
  extra_mileage_rate?: number;
  fuel_policy?: string;
  notes?: string;
}

export interface BookingUpdate {
  start_date?: string;
  end_date?: string;
  status?: string;
  payment_status?: string;
  initial_mileage?: number;
  final_mileage?: number;
  initial_fuel_level?: string;
  final_fuel_level?: string;
  notes?: string;
  cancellation_reason?: string;
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
  access_token: string;
  token_type: string;
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
