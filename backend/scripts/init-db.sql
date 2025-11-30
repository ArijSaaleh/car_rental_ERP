-- Initial Database Setup for Multi-Tenant Car Rental Platform
-- This script runs automatically when PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a schema for auditing functions
CREATE SCHEMA IF NOT EXISTS audit;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION audit.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO car_rental_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO car_rental_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO car_rental_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO car_rental_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO car_rental_user;
