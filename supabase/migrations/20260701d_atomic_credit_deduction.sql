-- Função atômica para dedução de créditos.
-- Usa UPDATE com WHERE creditos >= quantidade para evitar race condition.
-- Retorna o novo saldo ou lança exceção se saldo insuficiente.

CREATE OR REPLACE FUNCTION usar_creditos(
  p_user_id      UUID,
  p_quantidade   INTEGER,
  p_tipo         TEXT,
  p_descricao    TEXT DEFAULT NULL,
  p_metadata     JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (saldo_anterior INTEGER, saldo_novo INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo_anterior INTEGER;
  v_saldo_novo     INTEGER;
  v_leads_usados   INTEGER;
  v_msgs_usadas    INTEGER;
BEGIN
  -- Dedução atômica: só atualiza se houver saldo suficiente
  UPDATE usuarios
  SET creditos = creditos - p_quantidade
  WHERE id = p_user_id
    AND creditos >= p_quantidade
  RETURNING
    creditos + p_quantidade,  -- saldo_anterior
    creditos                  -- saldo_novo
  INTO v_saldo_anterior, v_saldo_novo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'creditos_insuficientes';
  END IF;

  -- Atualiza contador específico
  IF p_tipo = 'uso_lead' THEN
    UPDATE usuarios
    SET creditos_leads_usados = COALESCE(creditos_leads_usados, 0) + p_quantidade
    WHERE id = p_user_id;
  ELSIF p_tipo = 'uso_mensagem' THEN
    UPDATE usuarios
    SET creditos_mensagens_usados = COALESCE(creditos_mensagens_usados, 0) + p_quantidade
    WHERE id = p_user_id;
  END IF;

  -- Registra no histórico
  INSERT INTO historico_creditos (user_id, tipo, quantidade, saldo_anterior, saldo_novo, descricao, metadata)
  VALUES (
    p_user_id,
    p_tipo,
    -p_quantidade,
    v_saldo_anterior,
    v_saldo_novo,
    COALESCE(p_descricao, 'Uso de ' || p_quantidade || ' crédito(s)'),
    p_metadata
  );

  RETURN QUERY SELECT v_saldo_anterior, v_saldo_novo;
END;
$$;
