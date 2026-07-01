-- Migration: enrich contatos table with detailed Receita Federal fields
-- Adds columns from the leads schema while keeping all existing columns intact.

ALTER TABLE public.contatos
  -- Identificação CNPJ
  ADD COLUMN IF NOT EXISTS cnpj_raiz           text,
  ADD COLUMN IF NOT EXISTS filial_numero        integer,
  ADD COLUMN IF NOT EXISTS razao_social         text,
  ADD COLUMN IF NOT EXISTS nome_fantasia        text,
  ADD COLUMN IF NOT EXISTS matriz_filial        text,

  -- Situação cadastral detalhada
  ADD COLUMN IF NOT EXISTS situacao_motivo      text,
  ADD COLUMN IF NOT EXISTS situacao_data        timestamptz,

  -- Porte
  ADD COLUMN IF NOT EXISTS porte_codigo         text,
  ADD COLUMN IF NOT EXISTS porte_descricao      text,

  -- Natureza jurídica
  ADD COLUMN IF NOT EXISTS natureza_juridica_codigo      text,
  ADD COLUMN IF NOT EXISTS natureza_juridica_descricao   text,

  -- Qualificação do responsável
  ADD COLUMN IF NOT EXISTS qualificacao_responsavel_codigo      text,
  ADD COLUMN IF NOT EXISTS qualificacao_responsavel_descricao   text,

  -- MEI
  ADD COLUMN IF NOT EXISTS eh_mei              boolean default false,
  ADD COLUMN IF NOT EXISTS mei_data_opcao      date,
  ADD COLUMN IF NOT EXISTS mei_data_exclusao   date,

  -- Simples Nacional
  ADD COLUMN IF NOT EXISTS optante_simples       boolean default false,
  ADD COLUMN IF NOT EXISTS simples_data_opcao    date,
  ADD COLUMN IF NOT EXISTS simples_data_exclusao date,

  -- CNAE principal (complementa coluna cnae_principal já existente)
  ADD COLUMN IF NOT EXISTS cnae_principal_codigo      text,
  ADD COLUMN IF NOT EXISTS cnae_principal_descricao   text,
  ADD COLUMN IF NOT EXISTS cnaes_secundarios           jsonb,

  -- Endereço detalhado
  ADD COLUMN IF NOT EXISTS cep               text,
  ADD COLUMN IF NOT EXISTS tipo_logradouro   text,
  ADD COLUMN IF NOT EXISTS logradouro        text,
  ADD COLUMN IF NOT EXISTS numero_endereco   text,
  ADD COLUMN IF NOT EXISTS complemento       text,
  ADD COLUMN IF NOT EXISTS bairro            text,
  ADD COLUMN IF NOT EXISTS municipio         text,
  ADD COLUMN IF NOT EXISTS uf                text,
  ADD COLUMN IF NOT EXISTS ibge_municipio    integer,
  ADD COLUMN IF NOT EXISTS ibge_uf           integer,
  ADD COLUMN IF NOT EXISTS latitude          numeric(10, 7),
  ADD COLUMN IF NOT EXISTS longitude         numeric(10, 7),

  -- Telefone detalhado
  ADD COLUMN IF NOT EXISTS telefone_ddd    text,
  ADD COLUMN IF NOT EXISTS telefone_numero text,
  ADD COLUMN IF NOT EXISTS telefone_tipo   text,

  -- Email detalhado
  ADD COLUMN IF NOT EXISTS email_valido  boolean,
  ADD COLUMN IF NOT EXISTS email_dominio text,
  ADD COLUMN IF NOT EXISTS email_opt_out    boolean not null default false,
  ADD COLUMN IF NOT EXISTS email_opt_out_em timestamptz,

  -- Dados societários e financeiros
  ADD COLUMN IF NOT EXISTS quadro_societario jsonb,
  ADD COLUMN IF NOT EXISTS data_evento       timestamptz,
  ADD COLUMN IF NOT EXISTS data_consulta     timestamptz,

  -- Payload bruto para debug / reprocessamento
  ADD COLUMN IF NOT EXISTS payload_raw jsonb,

  -- Prospecção e CRM
  ADD COLUMN IF NOT EXISTS data_followup     date,
  ADD COLUMN IF NOT EXISTS instagram_url     text,
  ADD COLUMN IF NOT EXISTS linkedin_url      text,
  ADD COLUMN IF NOT EXISTS facebook_url      text,
  ADD COLUMN IF NOT EXISTS site_url          text;

-- Índices úteis para filtros e buscas
CREATE INDEX IF NOT EXISTS idx_contatos_uf              ON public.contatos (uf);
CREATE INDEX IF NOT EXISTS idx_contatos_municipio       ON public.contatos (municipio);
CREATE INDEX IF NOT EXISTS idx_contatos_cnpj_raiz       ON public.contatos (cnpj_raiz);
CREATE INDEX IF NOT EXISTS idx_contatos_cnae_principal  ON public.contatos (cnae_principal_codigo);
CREATE INDEX IF NOT EXISTS idx_contatos_eh_mei          ON public.contatos (eh_mei);
CREATE INDEX IF NOT EXISTS idx_contatos_porte           ON public.contatos (porte_descricao);
CREATE INDEX IF NOT EXISTS idx_contatos_data_abertura   ON public.contatos (data_abertura);
