-- Add credit management fields to usuarios table
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS creditos_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS creditos_expiracao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS alerta_creditos_baixos BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS limite_alerta_creditos INTEGER DEFAULT 100;

-- Create credit_packages table for one-time purchases
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  creditos INTEGER NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  bonus_percentage INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES credit_packages(id),
  creditos INTEGER NOT NULL,
  valor_pago DECIMAL(10,2) NOT NULL,
  asaas_payment_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral_program table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email VARCHAR(255),
  codigo_referencia VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, rewarded
  creditos_bonus INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add referral code to usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS codigo_referencia VARCHAR(50) UNIQUE;

-- Generate unique referral codes for existing users
UPDATE usuarios
SET codigo_referencia = SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)
WHERE codigo_referencia IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_codigo ON referrals(codigo_referencia);

-- Enable RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for credit_packages (public read)
CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (ativo = true);

-- Policies for credit_purchases
CREATE POLICY "Users can view their own purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
  ON credit_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for referrals
CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Insert default credit packages
INSERT INTO credit_packages (nome, descricao, creditos, preco, bonus_percentage, ativo)
VALUES
  ('Pacote Inicial', '500 créditos', 500, 50.00, 0, true),
  ('Pacote Plus', '1.500 créditos + 10% bônus', 1500, 140.00, 10, true),
  ('Pacote Pro', '3.000 créditos + 15% bônus', 3000, 270.00, 15, true),
  ('Pacote Empresarial', '10.000 créditos + 20% bônus', 10000, 850.00, 20, true)
ON CONFLICT DO NOTHING;

-- Function to apply referral bonuses
CREATE OR REPLACE FUNCTION apply_referral_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- When a referred user completes signup (has credits or subscription)
  IF NEW.creditos > 0 OR NEW.assinatura_id IS NOT NULL THEN
    -- Update referral status
    UPDATE referrals
    SET
      status = 'completed',
      completed_at = NOW()
    WHERE referred_id = NEW.id AND status = 'pending';

    -- Give bonus to referrer (500 credits)
    UPDATE usuarios
    SET creditos_bonus = creditos_bonus + 500
    WHERE id IN (
      SELECT referrer_id FROM referrals WHERE referred_id = NEW.id
    );

    -- Give bonus to referred user (300 credits)
    NEW.creditos_bonus = NEW.creditos_bonus + 300;

    -- Mark as rewarded
    UPDATE referrals
    SET status = 'rewarded', creditos_bonus = 500
    WHERE referred_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for referral bonuses
DROP TRIGGER IF EXISTS trigger_referral_bonus ON usuarios;
CREATE TRIGGER trigger_referral_bonus
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION apply_referral_bonus();

-- Function to check low credit alerts
CREATE OR REPLACE FUNCTION check_low_credit_alert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alerta_creditos_baixos = true AND NEW.creditos <= NEW.limite_alerta_creditos THEN
    -- This would trigger an email notification in the application
    -- For now, we'll just log it
    RAISE NOTICE 'Low credit alert for user %: % credits remaining', NEW.id, NEW.creditos;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low credit alerts
DROP TRIGGER IF NOT EXISTS trigger_low_credit_alert ON usuarios;
CREATE TRIGGER trigger_low_credit_alert
  AFTER UPDATE OF creditos ON usuarios
  FOR EACH ROW
  WHEN (NEW.creditos < OLD.creditos)
  EXECUTE FUNCTION check_low_credit_alert();
