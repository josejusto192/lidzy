-- Diagnóstico: Verificar estrutura da tabela instancias
-- Execute este script ANTES de aplicar a migration 034

-- 1. Verificar se a tabela 'instancias' existe
SELECT
    'Tabela instancias existe: ' || CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instancias'
    ) THEN 'SIM ✓' ELSE 'NÃO ✗' END as status;

-- 2. Verificar se 'instancias_whatsapp' existe (não deveria existir)
SELECT
    'Tabela instancias_whatsapp existe: ' || CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'instancias_whatsapp'
    ) THEN 'SIM (PROBLEMA!)' ELSE 'NÃO ✓' END as status;

-- 3. Listar colunas da tabela instancias
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'instancias'
ORDER BY ordinal_position;

-- 4. Verificar se as novas colunas já existem
SELECT
    'Coluna provider existe: ' || CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'provider'
    ) THEN 'SIM (já aplicado)' ELSE 'NÃO (precisa aplicar)' END as status
UNION ALL
SELECT
    'Coluna provider_config existe: ' || CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'provider_config'
    ) THEN 'SIM (já aplicado)' ELSE 'NÃO (precisa aplicar)' END
UNION ALL
SELECT
    'Coluna session_data existe: ' || CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'instancias'
        AND column_name = 'session_data'
    ) THEN 'SIM (já aplicado)' ELSE 'NÃO (precisa aplicar)' END;

-- 5. Contar instâncias existentes
SELECT
    'Total de instâncias: ' || COUNT(*)::text as status
FROM instancias;

-- 6. Verificar views que possam referenciar instancias
SELECT
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE view_definition LIKE '%instancias%'
AND table_schema = 'public';
