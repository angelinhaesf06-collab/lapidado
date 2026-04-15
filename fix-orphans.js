const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: 'lapidado-app/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Precisamos da service role para bypass de RLS

async function fixOrphanedProducts() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Chaves do Supabase não encontradas no .env.local')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🔍 Buscando joias sem dono...')
  
  // 1. Pegar o primeiro usuário (Angela)
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const angela = users[0]

  if (!angela) {
    console.error('❌ ERRO: Nenhum usuário encontrado no sistema.')
    return
  }

  console.log(`💎 Angela detectada: ${angela.email} (${angela.id})`)

  // 2. Atualizar produtos órfãos
  const { data: products, error: pError } = await supabase
    .from('products')
    .update({ user_id: angela.id })
    .is('user_id', null)
    .select()

  if (pError) {
    console.error('❌ Erro ao atualizar produtos:', pError.message)
  } else {
    console.log(`✅ ${products.length} joias restauradas com sucesso!`)
  }

  // 3. Atualizar categorias órfãs
  const { data: categories, error: cError } = await supabase
    .from('categories')
    .update({ user_id: angela.id })
    .is('user_id', null)
    .select()

  if (cError) {
    console.error('❌ Erro ao atualizar categorias:', cError.message)
  } else {
    console.log(`✅ ${categories.length} categorias restauradas com sucesso!`)
  }
}

fixOrphanedProducts()
