-- Remove planos antigos com preços de placeholder e insere os planos reais da Lidzy.
-- Usa nome como chave de upsert para ser idempotente.

DELETE FROM planos WHERE nome IN ('Starter', 'Professional', 'Enterprise');

INSERT INTO planos (nome, descricao, creditos_mensais, preco_mensal, preco_anual, ativo, features) VALUES
(
  'Starter',
  'Ideal para quem está começando a prospectar',
  1000,
  97.00,
  970.00,
  true,
  '["1.000 créditos/mês", "Geração de leads via Receita Federal (CNPJ)", "Filtros avançados de busca", "Exportação CSV e Lookalike", "Suporte via WhatsApp"]'::jsonb
),
(
  'Pro',
  'Para equipes em crescimento acelerado',
  3000,
  197.00,
  1970.00,
  true,
  '["3.000 créditos/mês", "Tudo do Starter", "Envio de mensagens com IA", "Agentes automatizados", "Relatórios de prospecção", "Suporte prioritário"]'::jsonb
),
(
  'Scale',
  'Para operações de alto volume de leads',
  10000,
  497.00,
  4970.00,
  true,
  '["10.000 créditos/mês", "Tudo do Pro", "Multi-usuário (até 5 usuários)", "API de integração", "Suporte dedicado"]'::jsonb
);
