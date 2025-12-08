// Core Types
export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'super_admin' | 'proprietaire' | 'employee';
  agence_id?: number;
  agence?: Agency;
  is_active: boolean;
  created_at: string;
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
  agence_id: number;
  agence?: Agency;
  client_id: number;
  client?: Customer;
  vehicule_id: number;
  vehicule?: Vehicle;
  date_debut: string;
  date_fin: string;
  prix_total: number;
  statut: 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
  created_at: string;
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
