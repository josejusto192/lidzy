-- Migration: Add Baileys support to WhatsApp instances
-- This allows instances to use either Z-API or Baileys as provider

-- Add provider column to instancias (normalizing the 'tipo' field)
ALTER TABLE instancias
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'zapi' CHECK (provider IN ('zapi', 'baileys'));

-- Add provider-specific configuration (stores API keys, URLs, etc)
ALTER TABLE instancias
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb;

-- Add session data for Baileys (stores auth state)
ALTER TABLE instancias
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}'::jsonb;

-- Add webhook URL for receiving messages
ALTER TABLE instancias
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Create index for faster provider queries
CREATE INDEX IF NOT EXISTS idx_instancias_provider ON instancias(provider);

-- Comment the columns
COMMENT ON COLUMN instancias.provider IS 'WhatsApp provider: zapi or baileys';
COMMENT ON COLUMN instancias.provider_config IS 'Provider-specific configuration (API keys, endpoints, etc)';
COMMENT ON COLUMN instancias.session_data IS 'Baileys session/auth state data';
COMMENT ON COLUMN instancias.webhook_url IS 'Webhook URL for receiving messages from provider';

-- Migrate existing instances to use normalized provider names
-- Map 'Z-API' -> 'zapi'
UPDATE instancias
SET provider = 'zapi',
    provider_config = jsonb_build_object(
      'instanceId', instance_id,
      'apiKey', token,
      'apiUrl', 'https://api.z-api.io'
    )
WHERE tipo = 'Z-API' OR provider IS NULL;

-- Note: The 'tipo' column can still be used for backward compatibility
-- but 'provider' should be used going forward for consistency
