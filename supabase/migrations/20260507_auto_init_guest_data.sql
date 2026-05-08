-- TRIGGER PARA CRIAR BRANDING AUTOMÁTICO AO CADASTRAR/ENTRAR
-- Garante que Visitantes e Novas Empresárias tenham um perfil inicial funcional

-- 1. Criar a função de inicialização de Branding
CREATE OR REPLACE FUNCTION public.handle_new_user_branding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.branding (user_id, business_name, store_name, primary_color, secondary_color, tagline)
  VALUES (
    NEW.id, 
    'MINHA LOJA LAPIDADA',
    'MINHA LOJA LAPIDADA',
    '#4a322e',
    '#c99090',
    'Sua visão lapidada com perfeição.'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriar o trigger de Branding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_branding();

-- 3. Função para inicializar Categorias (Corrigido: Adicionado SLUG que é obrigatório)
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, slug)
  VALUES 
    (NEW.id, 'ANÉIS', 'aneis-' || substr(NEW.id::text, 1, 8)),
    (NEW.id, 'BRINCOS', 'brincos-' || substr(NEW.id::text, 1, 8)),
    (NEW.id, 'COLARES', 'colares-' || substr(NEW.id::text, 1, 8)),
    (NEW.id, 'PULSEIRAS', 'pulseiras-' || substr(NEW.id::text, 1, 8))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recriar o trigger de Categorias
DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();
