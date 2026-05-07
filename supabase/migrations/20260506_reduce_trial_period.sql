-- AJUSTE DE PERIODO DE TESTE (TRIAL) PARA 7 DIAS
-- Foco em conversão rápida para tráfego pago

-- 1. Atualizar o padrão da coluna para futuros registros manuais ou diretos
ALTER TABLE branding ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

-- 2. Atualizar o gatilho principal (Redundância de segurança)
CREATE OR REPLACE FUNCTION public.handle_new_user_branding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.branding (
    user_id, 
    business_name, 
    slug, 
    primary_color, 
    secondary_color, 
    facebook, 
    tiktok,
    subscription_status,
    trial_ends_at
  )
  VALUES (
    new.id, 
    'Lapidado', 
    'loja-' || substring(new.id::text, 1, 8),
    '#4a322e', 
    '#c99090', 
    'CATÁLOGO REQUINTADO|10|BEM-VINDA AO BRILHO|Lapidado',
    '6 MESES DE GARANTIA',
    'trial',
    now() + interval '7 days'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
