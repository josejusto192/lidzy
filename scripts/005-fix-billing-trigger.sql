-- Corrigir trigger para funcionar tanto em INSERT quanto UPDATE
-- Remove o trigger antigo e cria um novo que funciona em ambos os casos

-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_descontar_creditos_mensagem ON mensagens;

-- Criar função atualizada que funciona para INSERT e UPDATE
CREATE OR REPLACE FUNCTION descontar_creditos_mensagem()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_saldo_anterior integer;
  v_saldo_novo integer;
BEGIN
  -- Para INSERT: verifica se is_billing já é true
  -- Para UPDATE: verifica se is_billing mudou para true
  IF (TG_OP = 'INSERT' AND NEW.is_billing = true) OR 
     (TG_OP = 'UPDATE' AND NEW.is_billing = true AND (OLD.is_billing IS NULL OR OLD.is_billing = false)) THEN
    
    -- Buscar user_id através da conversa
    SELECT c.user_id INTO v_user_id
    FROM conversas c
    WHERE c.id = NEW.conversa_id;
    
    IF v_user_id IS NULL THEN
      RAISE WARNING 'User not found for conversa_id: %, skipping credit deduction', NEW.conversa_id;
      RETURN NEW;
    END IF;
    
    -- Buscar saldo atual
    SELECT creditos INTO v_saldo_anterior
    FROM usuarios
    WHERE id = v_user_id;
    
    -- Verificar se tem créditos suficientes
    IF v_saldo_anterior < 1 THEN
      RAISE WARNING 'Insufficient credits for user: %, skipping credit deduction', v_user_id;
      RETURN NEW;
    END IF;
    
    -- Descontar 1 crédito e incrementar contador de mensagens
    UPDATE usuarios
    SET 
      creditos = creditos - 1,
      creditos_mensagens_usados = COALESCE(creditos_mensagens_usados, 0) + 1,
      atualizado_em = NOW()
    WHERE id = v_user_id;
    
    -- Calcular novo saldo
    v_saldo_novo := v_saldo_anterior - 1;
    
    -- Registrar no histórico
    INSERT INTO historico_creditos (
      user_id,
      tipo,
      quantidade,
      saldo_anterior,
      saldo_novo,
      descricao,
      metadata,
      created_at
    ) VALUES (
      v_user_id,
      'uso_mensagem',
      1,
      v_saldo_anterior,
      v_saldo_novo,
      'Mensagem enviada com IA',
      jsonb_build_object(
        'mensagem_id', NEW.id,
        'conversa_id', NEW.conversa_id,
        'message_id', NEW.message_id,
        'operation', TG_OP
      ),
      NOW()
    );
    
    RAISE NOTICE 'Crédito descontado (%) para user_id: %, saldo: % -> %', TG_OP, v_user_id, v_saldo_anterior, v_saldo_novo;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para INSERT
CREATE TRIGGER trigger_descontar_creditos_mensagem_insert
  AFTER INSERT ON mensagens
  FOR EACH ROW
  EXECUTE FUNCTION descontar_creditos_mensagem();

-- Criar trigger para UPDATE
CREATE TRIGGER trigger_descontar_creditos_mensagem_update
  AFTER UPDATE OF is_billing ON mensagens
  FOR EACH ROW
  EXECUTE FUNCTION descontar_creditos_mensagem();

-- Comentário explicativo
COMMENT ON FUNCTION descontar_creditos_mensagem() IS 
'Desconta automaticamente 1 crédito do usuário quando uma mensagem é inserida ou atualizada com is_billing = true. Funciona tanto para INSERT quanto UPDATE. Registra a transação no histórico de créditos.';
