import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkCategories() {
  console.log('🔍 INVESTIGAÇÃO NEXUS: VERIFICANDO CATEGORIAS...')

  const { data: categories, error: cError } = await supabase.from('categories').select('id, name, user_id')
  console.log('\n📂 CATEGORIAS ENCONTRADAS:', categories?.length || 0)
  console.table(categories)

  const { data: products, error: pError } = await supabase.from('products').select('user_id').limit(1)
  const targetUserId = products?.[0]?.user_id

  console.log('\n🎯 USUÁRIO ALVO (Dono das Joias):', targetUserId)
}

checkCategories()
