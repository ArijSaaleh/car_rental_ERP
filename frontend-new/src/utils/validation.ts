/**
 * Zod validation schemas for forms
 */
import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email requis')
    .email('Email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
  full_name: z.string()
    .min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  phone: z.string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide')
    .optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Vehicle schemas
export const vehicleSchema = z.object({
  license_plate: z.string()
    .min(1, 'Plaque d\'immatriculation requise')
    .regex(/^[A-Z0-9]+$/, 'Format de plaque invalide'),
  brand: z.string()
    .min(2, 'Marque requise'),
  model: z.string()
    .min(1, 'Modèle requis'),
  year: z.number()
    .min(2000, 'Année invalide')
    .max(new Date().getFullYear() + 1, 'Année invalide'),
  category: z.enum(['ECONOMY', 'COMPACT', 'SEDAN', 'SUV', 'LUXURY', 'VAN']),
  fuel_type: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  seats: z.number()
    .min(2, 'Minimum 2 places')
    .max(15, 'Maximum 15 places'),
  daily_rate: z.number()
    .min(0, 'Tarif journalier doit être positif'),
  mileage: z.number()
    .min(0, 'Kilométrage doit être positif'),
  color: z.string().optional(),
  vin_number: z.string()
    .length(17, 'Le VIN doit contenir 17 caractères')
    .optional(),
});

// Customer schemas
export const customerSchema = z.object({
  first_name: z.string()
    .min(2, 'Prénom requis'),
  last_name: z.string()
    .min(2, 'Nom requis'),
  email: z.string()
    .email('Email invalide')
    .optional(),
  phone: z.string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  cin_number: z.string()
    .length(8, 'Le CIN doit contenir 8 chiffres')
    .regex(/^[0-9]{8}$/, 'Le CIN doit contenir uniquement des chiffres')
    .optional(),
  driver_license_number: z.string()
    .min(1, 'Numéro de permis requis'),
  driver_license_issue_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  driver_license_expiry_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
});

// Booking schemas
export const bookingSchema = z.object({
  vehicle_id: z.string()
    .uuid('ID véhicule invalide'),
  customer_id: z.number()
    .int()
    .positive(),
  start_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  pickup_location: z.string()
    .min(1, 'Lieu de prise en charge requis'),
  return_location: z.string()
    .min(1, 'Lieu de retour requis'),
  notes: z.string().optional(),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'La date de fin doit être après la date de début',
  path: ['end_date'],
});

// Agency schemas
export const agencySchema = z.object({
  name: z.string()
    .min(2, 'Nom de l\'agence requis'),
  legal_name: z.string()
    .min(2, 'Raison sociale requise'),
  email: z.string()
    .email('Email invalide'),
  phone: z.string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  address: z.string()
    .min(5, 'Adresse requise'),
  city: z.string()
    .min(2, 'Ville requise'),
  postal_code: z.string()
    .regex(/^[0-9]{4}$/, 'Code postal invalide (4 chiffres)'),
  country: z.string()
    .default('Tunisia'),
  tax_id: z.string()
    .regex(/^[0-9]{7}[A-Z]$/, 'Matricule fiscal invalide (format: 1234567X)'),
  subscription_plan: z.enum(['BASIQUE', 'PRO', 'PREMIUM', 'ENTREPRISE']),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type AgencyInput = z.infer<typeof agencySchema>;
