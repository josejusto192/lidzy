-- Corrigir função de notificação de mudança de status do contato
-- O erro estava usando 'cliente' que não existe no enum status_contato
-- Os valores corretos são: 'novo_lead', 'contato_inicial', 'em_conversa', 'qualificado', 
-- 'proposta_enviada', 'negociacao', 'ganho', 'perdido', 'inativo'

CREATE OR REPLACE FUNCTION notificar_mudanca_status_contato()
RETURNS TRIGGER AS $$
BEGIN
    -- Corrigido de 'cliente' para 'ganho' que é o status correto no enum
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('ganho', 'negociacao') THEN
        INSERT INTO notificacoes (
            user_id,
            tipo,
            titulo,
            mensagem,
            link
        ) VALUES (
            NEW.user_id,
            'contato',
            'Status do Contato Atualizado',
            'O contato ' || COALESCE(NEW.nome_empresa, 'Sem nome') || ' mudou para: ' || 
            CASE NEW.status
                WHEN 'ganho' THEN 'Ganho'
                WHEN 'negociacao' THEN 'Negociação'
                ELSE NEW.status
            END,
            '/contatos/' || NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger caso ele não exista
DROP TRIGGER IF EXISTS trigger_notificar_mudanca_status_contato ON contatos;
CREATE TRIGGER trigger_notificar_mudanca_status_contato
    AFTER UPDATE ON contatos
    FOR EACH ROW
    EXECUTE FUNCTION notificar_mudanca_status_contato();
