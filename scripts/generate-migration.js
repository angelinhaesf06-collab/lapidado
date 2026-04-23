const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log("🚀 INICIANDO MIGRAÇÃO: MÓDULO DE CLIENTES E PAGAMENTOS");

  // 1. Tabela de Clientes
  // Nota: Como não posso rodar SQL puro facilmente sem RPC, vou usar a estratégia de 
  // verificar se a tabela existe tentando um select.
  
  console.log("检查/创建 tabela customers...");
  // Esta parte normalmente seria feita no console do Supabase. 
  // Vou gerar o SQL para a Angela copiar e colar no painel do Supabase, que é o mais seguro.
  
  const sql = `
  -- 1. Criar tabela de clientes
  CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  -- 2. Habilitar RLS para clientes
  ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage their own customers" ON customers FOR ALL TO authenticated USING (auth.uid() = user_id);

  -- 3. Atualizar tabela de vendas
  ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
  ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'cartao', 'promissoria', 'dinheiro'
  ALTER TABLE sales ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;
  ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente'; -- 'pago', 'pendente'
  ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_value DECIMAL(10,2);
  `;

  console.log("💎 SQL DE MIGRAÇÃO GERADO COM SUCESSO!");
  console.log("--------------------------------------------------");
  console.log(sql);
  console.log("--------------------------------------------------");
  console.log("👉 Angela, por favor, copie o código SQL acima e cole no SQL Editor do seu Supabase.");
}

migrate();
