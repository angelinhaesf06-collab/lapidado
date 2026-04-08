# 🚀 Próximos Passos para Ativação — Lapidado

Para que o catálogo fique online e seguro, siga estes 3 passos rápidos:

### 1. Criar Banco de Dados no Supabase
1. Acesse: [https://database.new](https://database.new)
2. Crie seu projeto "Lapidado".
3. No menu lateral, clique em **SQL Editor**.
4. Clique em **New Query**.
5. Copie o conteúdo do arquivo abaixo e cole lá:
   `supabase/migrations/20260407_initial_schema.sql`
6. Clique em **RUN**.

### 2. Configurar Variáveis de Ambiente
1. No dashboard do Supabase, vá em **Project Settings > API**.
2. Copie a **Project URL** e coloque no seu arquivo `.env`.
3. Copie a **anon public key** e coloque no seu arquivo `.env`.
4. Copie a **service_role secret** e coloque no seu arquivo `.env`.
5. Coloque sua **GEMINI_API_KEY** no final do arquivo.

### 3. Deploy na Vercel
1. Acesse: [https://vercel.com/new](https://vercel.com/new)
2. Conecte sua conta do GitHub.
3. Importe o repositório `lapidado-app`.
4. Nas **Environment Variables**, adicione todas as chaves do seu arquivo `.env`.
5. Clique em **DEPLOY**.

---
*Gerado por @aiox-master — O catálogo está pronto, agora é só brilhar! 💎*
