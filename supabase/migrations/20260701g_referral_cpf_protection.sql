-- =====================================================
-- Referral system v2: CPF verification + abuse prevention
-- =====================================================

-- 1. CPF único na tabela usuarios (anti-abuse)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS indicado_por UUID REFERENCES usuarios(id);

-- Unique constraint no CPF (ignora NULLs automaticamente no Postgres)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_cpf_unique'
  ) THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_cpf_unique UNIQUE (cpf);
  END IF;
END $$;

-- 2. Campos extras na tabela referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS bonus_liberado BOOLEAN DEFAULT FALSE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS cpf_verificado TEXT; -- CPF do indicado no momento da liberação
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS liberado_em TIMESTAMPTZ;

-- 3. Função para liberar bônus após verificação de CPF
CREATE OR REPLACE FUNCTION liberar_bonus_indicacao(
  p_user_id UUID,
  p_cpf TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario RECORD;
  v_referral RECORD;
  v_referrer RECORD;
  v_creditos_indicado INT := 300;
  v_creditos_indicador INT := 500;
BEGIN
  -- Busca usuário
  SELECT id, creditos, indicado_por INTO v_usuario
  FROM usuarios WHERE id = p_user_id;

  IF v_usuario IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Verifica CPF único
  IF EXISTS (SELECT 1 FROM usuarios WHERE cpf = p_cpf AND id != p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'CPF já cadastrado em outra conta');
  END IF;

  -- Salva CPF no usuário
  UPDATE usuarios SET cpf = p_cpf WHERE id = p_user_id;

  -- Se não tem indicação pendente, apenas salva CPF e retorna
  IF v_usuario.indicado_por IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'bonus', false, 'message', 'CPF salvo com sucesso');
  END IF;

  -- Busca referral pendente (não liberado ainda)
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_user_id AND bonus_liberado = FALSE
  LIMIT 1;

  IF v_referral IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'bonus', false, 'message', 'CPF salvo com sucesso');
  END IF;

  -- Libera créditos para o indicado
  UPDATE usuarios
  SET creditos = creditos + v_creditos_indicado
  WHERE id = p_user_id;

  INSERT INTO historico_creditos (user_id, tipo, quantidade, saldo_anterior, saldo_novo, descricao)
  VALUES (
    p_user_id, 'bonus_indicado', v_creditos_indicado,
    v_usuario.creditos, v_usuario.creditos + v_creditos_indicado,
    'Bônus por usar código de indicação e completar perfil'
  );

  -- Libera créditos para quem indicou
  SELECT id, creditos INTO v_referrer FROM usuarios WHERE id = v_usuario.indicado_por;

  IF v_referrer IS NOT NULL THEN
    UPDATE usuarios
    SET creditos = creditos + v_creditos_indicador
    WHERE id = v_referrer.id;

    INSERT INTO historico_creditos (user_id, tipo, quantidade, saldo_anterior, saldo_novo, descricao)
    VALUES (
      v_referrer.id, 'bonus_indicador', v_creditos_indicador,
      v_referrer.creditos, v_referrer.creditos + v_creditos_indicador,
      'Bônus por indicação: seu convidado completou o perfil'
    );
  END IF;

  -- Marca referral como liberado
  UPDATE referrals
  SET
    bonus_liberado = TRUE,
    cpf_verificado = p_cpf,
    liberado_em = NOW(),
    status = 'completed',
    creditos_bonus = v_creditos_indicador
  WHERE id = v_referral.id;

  RETURN jsonb_build_object(
    'ok', true,
    'bonus', true,
    'creditos_ganhos', v_creditos_indicado,
    'message', 'CPF verificado! Seus créditos de bônus foram liberados.'
  );
END;
$$;
