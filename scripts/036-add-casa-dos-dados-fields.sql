-- ============================================
-- CAMPOS ESPECÍFICOS DA CASA DOS DADOS
-- Suporta dados ricos de CNPJ sem quebrar
-- o fluxo atual (Serper/Google Maps)
-- ============================================

ALTER TABLE contatos
  ADD COLUMN IF NOT EXISTS situacao_cadastral VARCHAR(50),
  ADD COLUMN IF NOT EXISTS porte_empresa VARCHAR(50),
  ADD COLUMN IF NOT EXISTS natureza_juridica TEXT,
  ADD COLUMN IF NOT EXISTS cnae_principal TEXT,
  ADD COLUMN IF NOT EXISTS data_abertura DATE,
  ADD COLUMN IF NOT EXISTS capital_social DECIMAL(15,2);

-- Índices úteis para filtrar por esses campos
CREATE INDEX IF NOT EXISTS idx_contatos_situacao_cadastral ON contatos(situacao_cadastral);
CREATE INDEX IF NOT EXISTS idx_contatos_porte_empresa ON contatos(porte_empresa);
CREATE INDEX IF NOT EXISTS idx_contatos_cnpj ON contatos(cnpj);

COMMENT ON COLUMN contatos.situacao_cadastral IS 'Status na Receita Federal: ATIVA, INAPTA, BAIXADA, etc.';
COMMENT ON COLUMN contatos.porte_empresa IS 'Porte: ME, EPP, MEDIO, GRANDE';
COMMENT ON COLUMN contatos.natureza_juridica IS 'Natureza jurídica da empresa';
COMMENT ON COLUMN contatos.cnae_principal IS 'Código CNAE da atividade principal';
COMMENT ON COLUMN contatos.data_abertura IS 'Data de abertura da empresa na Receita Federal';
COMMENT ON COLUMN contatos.capital_social IS 'Capital social declarado';
