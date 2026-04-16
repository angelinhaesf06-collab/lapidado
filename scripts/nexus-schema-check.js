import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkSchema() {
  const { data: p } = await supabase.from('products').select('*').limit(1)
  const { data: s } = await supabase.from('sales').select('*').limit(1)
  
  console.log('--- ESTRUTURA DE PRODUTOS ---')
  if (p && p[0]) {
    console.log(Object.keys(p[0]))
    console.log('Amostra de descrição:', p[0].description)
  } else {
    console.log('Nenhum produto encontrado.')
  }

  console.log('\n--- ESTRUTURA DE VENDAS ---')
  if (s && s[0]) {
    console.log(Object.keys(s[0]))
    console.log('Valor de custo na venda:', s[0].cost_price)
  } else {
    console.log('Nenhuma venda encontrada.')
  }
}

checkSchema()
