-- 💎 SISTEMA DE ASSINATURAS LAPIDADO 2026
-- Gerenciamento de Trial de 30 dias e status do Google Play

ALTER TABLE branding ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'past_due'));
ALTER TABLE branding ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');
ALTER TABLE branding ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE branding ADD COLUMN IF NOT EXISTS google_play_subscription_id TEXT;

-- Índice para busca rápida de status
CREATE INDEX IF NOT EXISTS idx_branding_subscription_status ON branding(subscription_status);
