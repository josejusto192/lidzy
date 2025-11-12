-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  creditos_mensais INTEGER NOT NULL,
  preco_mensal DECIMAL(10,2) NOT NULL,
  preco_anual DECIMAL(10,2),
  asaas_plan_id VARCHAR(100),
  ativo BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES planos(id),
  asaas_subscription_id VARCHAR(100),
  asaas_customer_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, canceled, expired
  periodo VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  proxima_cobranca TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_assinaturas_user_id ON assinaturas(user_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_asaas_subscription_id ON assinaturas(asaas_subscription_id);

-- Inserir planos padrão
INSERT INTO planos (nome, descricao, creditos_mensais, preco_mensal, preco_anual, features) VALUES
('Starter', 'Ideal para começar', 500, 97.00, 970.00, '["500 créditos/mês", "Geração de leads", "Mensagens com IA", "Suporte por email"]'::jsonb),
('Professional', 'Para empresas em crescimento', 2000, 297.00, 2970.00, '["2000 créditos/mês", "Geração de leads ilimitada", "Mensagens com IA", "Suporte prioritário", "Relatórios avançados"]'::jsonb),
('Enterprise', 'Para grandes operações', 10000, 997.00, 9970.00, '["10000 créditos/mês", "Tudo do Professional", "Suporte dedicado", "API personalizada", "Treinamento incluído"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Adicionar campo de assinatura na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS assinatura_id UUID REFERENCES assinaturas(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(100);
