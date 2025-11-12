-- Tornar message_id nullable para permitir salvar mensagens antes de receber resposta do webhook
ALTER TABLE mensagens 
ALTER COLUMN message_id DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN mensagens.message_id IS 'ID da mensagem retornado pelo webhook ZAPI. Pode ser NULL até receber a resposta.';
