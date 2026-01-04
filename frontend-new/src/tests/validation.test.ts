import { describe, it, expect } from 'vitest';
import { 
  loginSchema, 
  vehicleSchema, 
  customerSchema,
  bookingSchema,
  agencySchema 
} from '../utils/validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('vehicleSchema', () => {
    it('validates correct vehicle data', () => {
      const validData = {
        license_plate: '123TU456',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        category: 'SEDAN' as const,
        fuel_type: 'GASOLINE' as const,
        transmission: 'AUTOMATIC' as const,
        seats: 5,
        daily_rate: 120.0,
        mileage: 15000,
      };

      const result = vehicleSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid year', () => {
      const invalidData = {
        license_plate: '123TU456',
        brand: 'Toyota',
        model: 'Corolla',
        year: 1999,
        category: 'SEDAN' as const,
        fuel_type: 'GASOLINE' as const,
        transmission: 'AUTOMATIC' as const,
        seats: 5,
        daily_rate: 120.0,
        mileage: 15000,
      };

      const result = vehicleSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('customerSchema', () => {
    it('validates correct customer data', () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+21612345678',
        cin_number: '12345678',
        driver_license_number: 'DL123456',
        driver_license_issue_date: '2020-01-01',
        driver_license_expiry_date: '2030-01-01',
      };

      const result = customerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid CIN', () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '+21612345678',
        cin_number: '123',  // Too short
        driver_license_number: 'DL123456',
        driver_license_issue_date: '2020-01-01',
        driver_license_expiry_date: '2030-01-01',
      };

      const result = customerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('bookingSchema', () => {
    it('validates correct booking data', () => {
      const validData = {
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        customer_id: 1,
        start_date: '2026-01-10',
        end_date: '2026-01-15',
        pickup_location: 'Tunis Airport',
        return_location: 'Tunis Airport',
      };

      const result = bookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects end date before start date', () => {
      const invalidData = {
        vehicle_id: '123e4567-e89b-12d3-a456-426614174000',
        customer_id: 1,
        start_date: '2026-01-15',
        end_date: '2026-01-10',  // Before start date
        pickup_location: 'Tunis Airport',
        return_location: 'Tunis Airport',
      };

      const result = bookingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('agencySchema', () => {
    it('validates correct agency data', () => {
      const validData = {
        name: 'Test Agency',
        legal_name: 'Test Agency SARL',
        email: 'agency@test.com',
        phone: '+21612345678',
        address: '123 Test Street',
        city: 'Tunis',
        postal_code: '1000',
        country: 'Tunisia',
        tax_id: '1234567X',
        subscription_plan: 'PRO' as const,
      };

      const result = agencySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid tax ID format', () => {
      const invalidData = {
        name: 'Test Agency',
        legal_name: 'Test Agency SARL',
        email: 'agency@test.com',
        phone: '+21612345678',
        address: '123 Test Street',
        city: 'Tunis',
        postal_code: '1000',
        country: 'Tunisia',
        tax_id: '123',  // Invalid format
        subscription_plan: 'PRO' as const,
      };

      const result = agencySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
