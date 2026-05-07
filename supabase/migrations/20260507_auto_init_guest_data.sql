-- TRIGGER PARA CRIAR BRANDING AUTOMÁTICO AO CADASTRAR/ENTRAR
-- Garante que Visitantes e Novas Empresárias tenham um perfil inicial funcional

-- 1. Criar a função de inicialização
CREATE OR REPLACE FUNCTION public.handle_new_user_branding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.branding (user_id, business_name, primary_color, secondary_color, slogan)
  VALUES (
    NEW.id, 
    'MINHA LOJA LAPIDADA', -- Nome padrão para o teste
    '#4a322e',              -- Marrom Luxo padrão
    '#c99090',              -- Rosé padrão
    'Sua visão lapidada com perfeição.'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar o trigger na tabela de usuários do Supabase (auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_branding();

-- 3. Garantir que categorias básicas existam para o novo usuário (Opcional, mas ajuda no teste)
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name)
  VALUES 
    (NEW.id, 'ANÉIS'),
    (NEW.id, 'BRINCOS'),
    (NEW.id, 'COLARES'),
    (NEW.id, 'PULSEIRAS')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_categories ON auth.users;
CREATE TRIGGER on_auth_user_created_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();
