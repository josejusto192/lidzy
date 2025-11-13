-- Migration: Add api_url and api_key columns to instancias table
-- This allows each instance to have its own Evolution API configuration

-- Add api_url column (Evolution API server URL)
ALTER TABLE instancias
ADD COLUMN IF NOT EXISTS api_url TEXT;

-- Add api_key column (Evolution API authentication key)
ALTER TABLE instancias
ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Add comments for documentation
COMMENT ON COLUMN instancias.api_url IS 'Evolution API server URL (e.g., http://31.97.24.93:7458)';
COMMENT ON COLUMN instancias.api_key IS 'Evolution API authentication key';

-- Update existing Evolution API instances to use environment default if not set
-- This migration is idempotent and can be run multiple times safely
