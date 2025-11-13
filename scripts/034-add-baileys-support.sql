-- Migration: Add Baileys support to WhatsApp instances
-- This allows instances to use either Z-API or Baileys as provider

-- Add provider column to instancias_whatsapp
ALTER TABLE instancias_whatsapp
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'zapi' CHECK (provider IN ('zapi', 'baileys'));

-- Add provider-specific configuration
ALTER TABLE instancias_whatsapp
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb;

-- Add session data for Baileys (stores auth state)
ALTER TABLE instancias_whatsapp
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;

-- Add webhook URL for receiving messages
ALTER TABLE instancias_whatsapp
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Create index for faster provider queries
CREATE INDEX IF NOT EXISTS idx_instancias_provider ON instancias_whatsapp(provider);

-- Comment the columns
COMMENT ON COLUMN instancias_whatsapp.provider IS 'WhatsApp provider: zapi or baileys';
COMMENT ON COLUMN instancias_whatsapp.provider_config IS 'Provider-specific configuration (API keys, endpoints, etc)';
COMMENT ON COLUMN instancias_whatsapp.session_data IS 'Baileys session/auth state data';
COMMENT ON COLUMN instancias_whatsapp.webhook_url IS 'Webhook URL for receiving messages from provider';

-- Update existing instances to use zapi provider
UPDATE instancias_whatsapp
SET provider = 'zapi'
WHERE provider IS NULL;
