-- ============================================
-- ETIQUETAS (TAGS) PARA CONTATOS
-- ============================================

-- Tabela de tags/etiquetas
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#3b82f6', -- Hex color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, nome)
);

-- Tabela de relacionamento contatos <-> tags (muitos para muitos)
CREATE TABLE IF NOT EXISTS contatos_tags (
  contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contato_id, tag_id)
);

-- Índices para tags
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tags_contato_id ON contatos_tags(contato_id);
CREATE INDEX IF NOT EXISTS idx_contatos_tags_tag_id ON contatos_tags(tag_id);

-- ============================================
-- ORIGEM DO CONTATO
-- ============================================

-- Adicionar campos de origem à tabela contatos
ALTER TABLE contatos
ADD COLUMN IF NOT EXISTS origem VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS fonte_id UUID, -- Referência ao agente/instância que originou
ADD COLUMN IF NOT EXISTS fonte_detalhes JSONB; -- Detalhes adicionais da origem

-- Índice para análise de origem
CREATE INDEX IF NOT EXISTS idx_contatos_origem ON contatos(origem);
CREATE INDEX IF NOT EXISTS idx_contatos_fonte_id ON contatos(fonte_id);

-- Comentários explicativos
COMMENT ON COLUMN contatos.origem IS 'Origem do contato: manual, scraping, importacao, agente_ia, api, whatsapp, etc';
COMMENT ON COLUMN contatos.fonte_id IS 'ID do agente ou instância que originou o contato';
COMMENT ON COLUMN contatos.fonte_detalhes IS 'Detalhes adicionais sobre a origem (JSON)';

-- ============================================
-- GESTÃO DE PROJETOS
-- ============================================

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'planejamento',
  prioridade VARCHAR(20) DEFAULT 'media',
  valor_total DECIMAL(12,2) DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  data_entrega_prevista DATE,
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  cor VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento contatos <-> projetos (muitos para muitos)
CREATE TABLE IF NOT EXISTS contatos_projetos (
  contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  funcao VARCHAR(100), -- 'cliente', 'tomador_decisao', 'influenciador', 'beneficiario', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contato_id, projeto_id)
);

-- Tabela de marcos/milestones do projeto
CREATE TABLE IF NOT EXISTS projeto_marcos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_prevista DATE,
  data_conclusao DATE,
  concluido BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tarefas do projeto
CREATE TABLE IF NOT EXISTS projeto_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  marco_id UUID REFERENCES projeto_marcos(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'pendente',
  prioridade VARCHAR(20) DEFAULT 'media',
  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  data_prevista DATE,
  data_conclusao DATE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de documentos/anexos do projeto
CREATE TABLE IF NOT EXISTS projeto_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100), -- 'contrato', 'proposta', 'briefing', 'entrega', etc.
  url TEXT NOT NULL,
  tamanho_bytes BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de comentários/notas do projeto
CREATE TABLE IF NOT EXISTS projeto_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  tarefa_id UUID REFERENCES projeto_tarefas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para projetos
CREATE INDEX IF NOT EXISTS idx_projetos_user_id ON projetos(user_id);
CREATE INDEX IF NOT EXISTS idx_projetos_status ON projetos(status);
CREATE INDEX IF NOT EXISTS idx_projetos_data_inicio ON projetos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_contatos_projetos_contato_id ON contatos_projetos(contato_id);
CREATE INDEX IF NOT EXISTS idx_contatos_projetos_projeto_id ON contatos_projetos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_marcos_projeto_id ON projeto_marcos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_tarefas_projeto_id ON projeto_tarefas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_tarefas_marco_id ON projeto_tarefas(marco_id);
CREATE INDEX IF NOT EXISTS idx_projeto_tarefas_responsavel_id ON projeto_tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_projeto_documentos_projeto_id ON projeto_documentos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_comentarios_projeto_id ON projeto_comentarios(projeto_id);
CREATE INDEX IF NOT EXISTS idx_projeto_comentarios_tarefa_id ON projeto_comentarios(tarefa_id);

-- ============================================
-- RLS POLICIES - TAGS
-- ============================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own contatos_tags" ON contatos_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contatos
      WHERE contatos.id = contatos_tags.contato_id
      AND contatos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contatos_tags" ON contatos_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contatos
      WHERE contatos.id = contatos_tags.contato_id
      AND contatos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own contatos_tags" ON contatos_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM contatos
      WHERE contatos.id = contatos_tags.contato_id
      AND contatos.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - PROJETOS
-- ============================================

ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos_projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_marcos ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_comentarios ENABLE ROW LEVEL SECURITY;

-- Projetos
CREATE POLICY "Users can view own projetos" ON projetos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projetos" ON projetos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projetos" ON projetos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projetos" ON projetos
  FOR DELETE USING (auth.uid() = user_id);

-- Contatos_Projetos
CREATE POLICY "Users can view own contatos_projetos" ON contatos_projetos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = contatos_projetos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contatos_projetos" ON contatos_projetos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = contatos_projetos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own contatos_projetos" ON contatos_projetos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = contatos_projetos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

-- Marcos
CREATE POLICY "Users can view own projeto_marcos" ON projeto_marcos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_marcos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own projeto_marcos" ON projeto_marcos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_marcos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own projeto_marcos" ON projeto_marcos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_marcos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own projeto_marcos" ON projeto_marcos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_marcos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

-- Tarefas
CREATE POLICY "Users can view own projeto_tarefas" ON projeto_tarefas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_tarefas.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own projeto_tarefas" ON projeto_tarefas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_tarefas.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own projeto_tarefas" ON projeto_tarefas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_tarefas.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own projeto_tarefas" ON projeto_tarefas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_tarefas.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

-- Documentos
CREATE POLICY "Users can view own projeto_documentos" ON projeto_documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_documentos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own projeto_documentos" ON projeto_documentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_documentos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own projeto_documentos" ON projeto_documentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_documentos.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

-- Comentários
CREATE POLICY "Users can view own projeto_comentarios" ON projeto_comentarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_comentarios.projeto_id
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own projeto_comentarios" ON projeto_comentarios
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos
      WHERE projetos.id = projeto_comentarios.projeto_id
      AND projetos.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update own projeto_comentarios" ON projeto_comentarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projeto_comentarios" ON projeto_comentarios
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_projetos_updated_at
  BEFORE UPDATE ON projetos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projeto_tarefas_updated_at
  BEFORE UPDATE ON projeto_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projeto_comentarios_updated_at
  BEFORE UPDATE ON projeto_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar progresso do projeto baseado nas tarefas
CREATE OR REPLACE FUNCTION atualizar_progresso_projeto()
RETURNS TRIGGER AS $$
DECLARE
  total_tarefas INTEGER;
  tarefas_concluidas INTEGER;
  novo_progresso INTEGER;
BEGIN
  -- Contar total de tarefas e tarefas concluídas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'concluida')
  INTO total_tarefas, tarefas_concluidas
  FROM projeto_tarefas
  WHERE projeto_id = COALESCE(NEW.projeto_id, OLD.projeto_id);

  -- Calcular progresso
  IF total_tarefas > 0 THEN
    novo_progresso := ROUND((tarefas_concluidas::DECIMAL / total_tarefas) * 100);
  ELSE
    novo_progresso := 0;
  END IF;

  -- Atualizar progresso do projeto
  UPDATE projetos
  SET progresso = novo_progresso,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.projeto_id, OLD.projeto_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso quando tarefas mudam
CREATE TRIGGER trigger_atualizar_progresso_projeto
  AFTER INSERT OR UPDATE OR DELETE ON projeto_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_progresso_projeto();

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir algumas tags padrão (opcional - comentado por padrão)
-- INSERT INTO tags (user_id, nome, cor) VALUES
-- (auth.uid(), 'Urgente', '#ef4444'),
-- (auth.uid(), 'VIP', '#f59e0b'),
-- (auth.uid(), 'Follow-up', '#3b82f6'),
-- (auth.uid(), 'Qualificado', '#22c55e')
-- ON CONFLICT DO NOTHING;
