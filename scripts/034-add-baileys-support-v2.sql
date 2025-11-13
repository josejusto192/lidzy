-- Migration: Add Baileys support to WhatsApp instances (v2 - com verificações)
-- This allows instances to use either Z-API or Baileys as provider

-- IMPORTANTE: Este script assume que a tabela se chama 'instancias' (não 'instancias_whatsapp')
-- Se você está recebendo erro de "relation instancias_whatsapp does not exist",
-- certifique-se de que está usando o nome correto da tabela.

-- Verificação: A tabela instancias existe?
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instancias'
    ) THEN
        RAISE EXCEPTION 'ERRO: Tabela "instancias" não existe! Execute o script 007_create_instancias.sql primeiro.';
    END IF;
END $$;

-- 1. Add provider column to instancias (normalizing the 'tipo' field)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'provider'
    ) THEN
        ALTER TABLE instancias
        ADD COLUMN provider VARCHAR(20) DEFAULT 'zapi' CHECK (provider IN ('zapi', 'baileys'));
        RAISE NOTICE 'Coluna "provider" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "provider" já existe';
    END IF;
END $$;

-- 2. Add provider-specific configuration (stores API keys, URLs, etc)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'provider_config'
    ) THEN
        ALTER TABLE instancias
        ADD COLUMN provider_config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna "provider_config" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "provider_config" já existe';
    END IF;
END $$;

-- 3. Add session data for Baileys (stores auth state)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'session_data'
    ) THEN
        ALTER TABLE instancias
        ADD COLUMN session_data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna "session_data" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "session_data" já existe';
    END IF;
END $$;

-- 4. Add webhook URL for receiving messages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'webhook_url'
    ) THEN
        ALTER TABLE instancias
        ADD COLUMN webhook_url TEXT;
        RAISE NOTICE 'Coluna "webhook_url" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "webhook_url" já existe';
    END IF;
END $$;

-- 5. Create index for faster provider queries
CREATE INDEX IF NOT EXISTS idx_instancias_provider ON instancias(provider);

-- 6. Add comments to columns
COMMENT ON COLUMN instancias.provider IS 'WhatsApp provider: zapi or baileys';
COMMENT ON COLUMN instancias.provider_config IS 'Provider-specific configuration (API keys, endpoints, etc)';
COMMENT ON COLUMN instancias.session_data IS 'Baileys session/auth state data';
COMMENT ON COLUMN instancias.webhook_url IS 'Webhook URL for receiving messages from provider';

-- 7. Migrate existing instances to use normalized provider names
-- Map 'Z-API' -> 'zapi' and populate provider_config
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE instancias
    SET provider = 'zapi',
        provider_config = jsonb_build_object(
            'instanceId', instance_id,
            'apiKey', token,
            'apiUrl', 'https://api.z-api.io'
        )
    WHERE (tipo = 'Z-API' OR provider IS NULL)
    AND provider_config = '{}'::jsonb;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Migradas % instâncias Z-API existentes', updated_count;
END $$;

-- 8. Verificação final
DO $$
DECLARE
    total_instancias INTEGER;
    instancias_zapi INTEGER;
    instancias_baileys INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_instancias FROM instancias;
    SELECT COUNT(*) INTO instancias_zapi FROM instancias WHERE provider = 'zapi';
    SELECT COUNT(*) INTO instancias_baileys FROM instancias WHERE provider = 'baileys';

    RAISE NOTICE '===============================================';
    RAISE NOTICE 'Migration 034 concluída com sucesso!';
    RAISE NOTICE 'Total de instâncias: %', total_instancias;
    RAISE NOTICE 'Instâncias Z-API: %', instancias_zapi;
    RAISE NOTICE 'Instâncias Baileys: %', instancias_baileys;
    RAISE NOTICE '===============================================';
END $$;
