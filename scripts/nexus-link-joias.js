import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function linkJoias() {
  console.log('💍 VINCULANDO JOIAS ÀS CATEGORIAS...')

  const { data: cats } = await supabase.from('categories').select('*')
  const { data: prods } = await supabase.from('products').select('*')

  if (!prods || !cats) return

  for (const prod of prods) {
    const prodName = prod.name.toUpperCase()
    let matchedCat = null

    if (prodName.includes('BRINCO')) matchedCat = cats.find(c => c.name === 'BRINCOS')
    else if (prodName.includes('ANEL') || prodName.includes('ANÉIS')) matchedCat = cats.find(c => c.name === 'ANÉIS')
    else if (prodName.includes('COLAR')) matchedCat = cats.find(c => c.name === 'COLARES')
    else if (prodName.includes('PULSEIRA')) matchedCat = cats.find(c => c.name === 'PULSEIRAS')
    
    if (matchedCat) {
      console.log(`✨ Vinculando ${prod.name} -> ${matchedCat.name}`)
      await supabase.from('products').update({ category_id: matchedCat.id }).eq('id', prod.id)
    }
  }

  console.log('\n✅ VÍNCULO CONCLUÍDO!')
}

linkJoias()
