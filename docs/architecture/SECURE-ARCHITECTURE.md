# Arquitetura de Segurança — Projeto Lapidado (v1.0)

Este documento define os padrões de segurança para a integração entre Next.js (Vercel), Supabase e GitHub.

## 1. Autenticação e Autorização (Supabase Auth)
- **Método:** JWT (JSON Web Tokens) gerenciados pelo Supabase.
- **Middleware Next.js:** Interceptação de rotas administrativas `/admin/*` para validação de sessão server-side.
- **Roles:** 
  - `anon`: Acesso apenas de leitura ao catálogo.
  - `authenticated`: Acesso completo (admin) para gestão de joias e categorias.

## 2. Camada de Dados (Row Level Security - RLS)
Todas as tabelas no Supabase devem ter RLS habilitado por padrão.
- **Tabela `products`**:
  - `policy "Enable read access for all users"`: Permite `SELECT` para todos.
  - `policy "Enable all access for admins only"`: Restringe `INSERT/UPDATE/DELETE` para usuários autenticados.
- **Tabela `categories`**: Mesma lógica de proteção.

## 3. Segurança de Ambiente (Vercel + GitHub)
- **GitHub Secrets**: Nenhuma chave de API (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) deve ser salva no código. Devem ser configuradas apenas no ambiente da Vercel e GitHub Actions.
- **Next.js Server Actions**: Toda manipulação de dados sensíveis deve ocorrer no lado do servidor (Server-only) para evitar exposição de chaves no cliente.

## 4. Pipeline de Qualidade (CI/CD)
- **Static Analysis**: ESLint e TypeScript strict mode.
- **Security Scan**: `npm audit` em cada Pull Request para detectar dependências vulneráveis.
- **Secret Scanning**: Proteção nativa do GitHub ativada para impedir commits de chaves.

---
*Gerado por @architect via AIOX Framework*
