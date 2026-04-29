import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { table, items } = await req.json() // items: { id: string, display_order: number }[]
    const authHeader = req.headers.get('authorization')
    const VALID_TOKEN = 'Bearer LAPIDADO_ADMIN_2026'

    if (authHeader !== VALID_TOKEN) {
      return NextResponse.json({ error: 'ACESSO NEGADO' }, { status: 401 })
    }

    if (!table || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'DADOS INCOMPLETOS' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'CONFIGURAÇÃO AUSENTE' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // 💎 NEXUS: Atualização em lote (Bulk Update)
    // O Supabase não tem um 'bulk update' direto via SDK para colunas diferentes em linhas diferentes
    // Então fazemos um loop de promessas (o ideal seria uma RPC, mas vamos via SDK para simplicidade)
    
    const updates = items.map(item => 
      supabaseAdmin
        .from(table)
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    )

    const results = await Promise.all(updates)
    
    const errors = results.filter(r => r.error).map(r => r.error?.message)
    if (errors.length > 0) {
      console.error('ERROS NO REORDER:', errors)
      throw new Error('Falha ao atualizar alguns itens: ' + errors[0])
    }

    revalidatePath('/')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true })

  } catch (err) {
    const error = err as Error
    console.error('ERRO NA REORDENAÇÃO:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
