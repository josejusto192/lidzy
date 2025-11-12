-- Add automation fields to agentes_prospeccao table
ALTER TABLE agentes_prospeccao 
ADD COLUMN IF NOT EXISTS horario_inicio TIME,
ADD COLUMN IF NOT EXISTS limite_mensagens INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS nichos TEXT[] DEFAULT '{}';

-- Add comment to explain the fields
COMMENT ON COLUMN agentes_prospeccao.horario_inicio IS 'Horário de início do agente (formato HH:00)';
COMMENT ON COLUMN agentes_prospeccao.limite_mensagens IS 'Limite de mensagens que o agente pode enviar';
COMMENT ON COLUMN agentes_prospeccao.nichos IS 'Array de nichos que o agente irá prospectar';
