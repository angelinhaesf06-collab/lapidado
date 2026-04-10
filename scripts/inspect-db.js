const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectTable() {
  console.log('💎 NEXUS: INSPECIONANDO COLUNAS DA TABELA PRODUCTS...')
  
  // Tentar buscar um registro para ver as chaves
  const { data, error } = await supabase.from('products').select('*').limit(1)
  
  if (error) {
    console.error('❌ ERRO AO INSPECIONAR:', error.message)
    return
  }

  if (data && data.length > 0) {
    console.log('✅ COLUNAS ENCONTRADAS:', Object.keys(data[0]).join(', '))
  } else {
    console.log('ℹ️ TABELA VAZIA. TENTANDO BUSCAR O ESQUEMA...')
    // Se a tabela estiver vazia, tentamos inserir um dado fake e ver o erro detalhado
    const { error: insertError } = await supabase.from('products').insert([{ name: 'TESTE' }]).select()
    console.log('DICA DO BANCO:', insertError?.message)
  }
}

inspectTable()
