-- Criar tipo ENUM para status de contatos
DO $$ BEGIN
    CREATE TYPE status_contato AS ENUM (
        'novo_lead',
        'contato_inicial',
        'em_conversa',
        'qualificado',
        'proposta_enviada',
        'negociacao',
        'ganho',
        'perdido',
        'inativo'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Remover o default antes de alterar o tipo da coluna
ALTER TABLE contatos ALTER COLUMN status DROP DEFAULT;

-- Adicionando mapeamento para "Mensagem Enviada" e outros valores existentes
-- Atualizar status existentes para o novo padrão (normalização)
UPDATE contatos SET status = 'novo_lead' WHERE status IS NULL OR status = '';
UPDATE contatos SET status = 'contato_inicial' WHERE status ILIKE '%mensagem enviada%' OR status ILIKE '%contato%' OR status ILIKE '%inicial%';
UPDATE contatos SET status = 'em_conversa' WHERE status ILIKE '%conversa%' OR status ILIKE '%ativo%' OR status ILIKE '%respondeu%';
UPDATE contatos SET status = 'qualificado' WHERE status ILIKE '%qualificado%' OR status ILIKE '%interessado%';
UPDATE contatos SET status = 'proposta_enviada' WHERE status ILIKE '%proposta%';
UPDATE contatos SET status = 'negociacao' WHERE status ILIKE '%negoci%';
UPDATE contatos SET status = 'ganho' WHERE status ILIKE '%ganho%' OR status ILIKE '%fechado%' OR status ILIKE '%convertido%';
UPDATE contatos SET status = 'perdido' WHERE status ILIKE '%perdido%' OR status ILIKE '%recusado%';
UPDATE contatos SET status = 'inativo' WHERE status ILIKE '%inativo%';
UPDATE contatos SET status = 'novo_lead' WHERE status ILIKE '%novo%' OR status ILIKE '%lead%';

-- Mapear qualquer outro valor não reconhecido para 'novo_lead'
UPDATE contatos SET status = 'novo_lead' 
WHERE status NOT IN ('novo_lead', 'contato_inicial', 'em_conversa', 'qualificado', 'proposta_enviada', 'negociacao', 'ganho', 'perdido', 'inativo');

-- Alterar coluna para usar o tipo ENUM
ALTER TABLE contatos ALTER COLUMN status TYPE status_contato USING status::status_contato;

-- Definir valor padrão após alterar o tipo
ALTER TABLE contatos ALTER COLUMN status SET DEFAULT 'novo_lead'::status_contato;

-- Adicionar NOT NULL constraint
ALTER TABLE contatos ALTER COLUMN status SET NOT NULL;

-- Adicionar índice para melhorar performance de queries por status
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);

-- Adicionar índice composto para queries de status + user_id
CREATE INDEX IF NOT EXISTS idx_contatos_user_status ON contatos(user_id, status);

-- Mostrar contagem por status
SELECT 
    status,
    COUNT(*) as total
FROM contatos
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'novo_lead' THEN 1
        WHEN 'contato_inicial' THEN 2
        WHEN 'em_conversa' THEN 3
        WHEN 'qualificado' THEN 4
        WHEN 'proposta_enviada' THEN 5
        WHEN 'negociacao' THEN 6
        WHEN 'ganho' THEN 7
        WHEN 'perdido' THEN 8
        WHEN 'inativo' THEN 9
    END;
