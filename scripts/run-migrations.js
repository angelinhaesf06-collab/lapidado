const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Conexão via String de Conexão (Formato Node.js)
// Usando a senha fornecida pela usuária (Angel1689@@)
const connectionString = 'postgres://postgres.lkftxcnfzpjrhwjobfsr:Angel1689%40%40@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
  })

  try {
    console.log('💎 Conectando ao motor do Catálogo Lapidado...')
    await client.connect()
    console.log('✅ Conexão estabelecida com sucesso!')

    const migrationPath = path.join(__dirname, '../supabase/migrations/20260407_initial_schema.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('✨ Criando as gavetas (tabelas) do acervo...')
    await client.query(sql)
    console.log('✅ Tudo pronto! Tabelas de Produtos e Categorias criadas.')

    // Inserir categorias iniciais
    console.log('🎁 Adicionando as primeiras categorias de joias...')
    const seedSql = `
      INSERT INTO categories (name, slug) VALUES 
      ('Anéis', 'aneis'), 
      ('Colares', 'colares'), 
      ('Brincos', 'brincos'), 
      ('Pulseiras', 'pulseiras') 
      ON CONFLICT (name) DO NOTHING;
    `
    await client.query(seedSql)
    console.log('✅ Categorias iniciais prontas para brilhar!')

  } catch (err) {
    console.error('❌ Erro durante o setup do banco:', err.message)
  } finally {
    await client.end()
  }
}

runMigration()
