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
  fullName: z.string()
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
  licensePlate: z.string()
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
  fuelType: z.enum(['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE']),
  transmission: z.enum(['MANUELLE', 'AUTOMATIQUE']),
  seats: z.number()
    .min(2, 'Minimum 2 places')
    .max(15, 'Maximum 15 places'),
  dailyRate: z.number()
    .min(0, 'Tarif journalier doit être positif'),
  mileage: z.number()
    .min(0, 'Kilométrage doit être positif'),
  color: z.string().optional(),
  vin: z.string()
    .length(17, 'Le VIN doit contenir 17 caractères')
    .optional(),
});

// Customer schemas
export const customerSchema = z.object({
  firstName: z.string()
    .min(2, 'Prénom requis'),
  lastName: z.string()
    .min(2, 'Nom requis'),
  email: z.string()
    .email('Email invalide')
    .optional(),
  phone: z.string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  cinNumber: z.string()
    .length(8, 'Le CIN doit contenir 8 chiffres')
    .regex(/^[0-9]{8}$/, 'Le CIN doit contenir uniquement des chiffres')
    .optional(),
  licenseNumber: z.string()
    .min(1, 'Numéro de permis requis'),
  licenseIssueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  licenseExpiryDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

// Booking schemas
export const bookingSchema = z.object({
  customerId: z.string().min(1, 'Veuillez sélectionner un client'),
  vehicleId: z.string().min(1, 'Veuillez sélectionner un véhicule'),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'La date de début doit être dans le futur ou aujourd\'hui'),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  fuelPolicy: z.enum(['full_to_full', 'same_to_same', 'prepaid']).optional(),
  notes: z.string().max(500, 'Les notes ne doivent pas dépasser 500 caractères').optional(),
  depositAmount: z.number().nonnegative('Le montant de la caution doit être positif').optional(),
  mileageLimit: z.number().int().positive('La limite de kilométrage doit être positive').optional(),
  extraMileageRate: z.number().positive('Le tarif par km supplémentaire doit être positif').optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 365;
}, {
  message: 'La durée de location ne peut pas dépasser 1 an',
  path: ['endDate'],
});

// Agency schemas
export const agencySchema = z.object({
  name: z.string()
    .min(2, 'Nom de l\'agence requis'),
  legalName: z.string()
    .min(2, 'Raison sociale requise'),
  email: z.string()
    .email('Email invalide'),
  phone: z.string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  address: z.string()
    .min(5, 'Adresse requise'),
  city: z.string()
    .min(2, 'Ville requise'),
  postalCode: z.string()
    .regex(/^[0-9]{4}$/, 'Code postal invalide (4 chiffres)'),
  country: z.string()
    .default('Tunisia'),
  taxId: z.string()
    .regex(/^[0-9]{7}[A-Z]$/, 'Matricule fiscal invalide (format: 1234567X)'),
  subscriptionPlan: z.enum(['BASIQUE', 'STANDARD', 'PREMIUM', 'ENTREPRISE']),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type AgencyInput = z.infer<typeof agencySchema>;
