-- GATILHO AUTOMÁTICO PARA CRIAR BRANDING AO CADASTRAR USUÁRIO
-- Isso garante que toda nova empresária já nasça com uma marca configurada

CREATE OR REPLACE FUNCTION public.handle_new_user_branding()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.branding (user_id, business_name, primary_color, secondary_color, facebook, tiktok)
  VALUES (
    new.id, 
    'Lapidado', 
    '#4a322e', 
    '#c99090', 
    'CATÁLOGO REQUINTADO|10|BEM-VINDA AO BRILHO|Lapidado',
    '6 MESES DE GARANTIA'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar o gatilho na tabela de usuários do Supabase (auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_branding();
