const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedCategories() {
  const categories = [
    { name: 'Anéis', slug: 'aneis' },
    { name: 'Colares', slug: 'colares' },
    { name: 'Brincos', slug: 'brincos' },
    { name: 'Pulseiras', slug: 'pulseiras' }
  ]

  console.log('💎 Cadastrando categorias no Lapidado...')

  for (const cat of categories) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(cat, { onConflict: 'name' })
    
    if (error) {
      console.error(`❌ Erro ao cadastrar ${cat.name}:`, error.message)
    } else {
      console.log(`✅ Categoria "${cat.name}" pronta!`)
    }
  }

  console.log('✨ Todas as categorias iniciais foram lapidadas!')
}

seedCategories()
