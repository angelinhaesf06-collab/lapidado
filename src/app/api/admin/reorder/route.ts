import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { table, items } = await req.json() // items: { id: string, display_order: number }[]
    
    // 🔒 SEGURANÇA DINÂMICA: Validação Real de Sessão
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'ACESSO NEGADO: SESSÃO INVÁLIDA' }, { status: 401 })
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

    // 🔒 ISOLAMENTO ADICIONAL: Verificar se todos os IDs pertencem ao usuário logado
    // Como estamos usando SERVICE_ROLE, precisamos garantir que o usuário não está tentando
    // reordenar produtos de outra pessoa passando IDs arbitrários.
    const itemIds = items.map(i => i.id)
    const { data: ownershipCheck, error: checkError } = await supabaseAdmin
      .from(table)
      .select('id')
      .eq('user_id', user.id)
      .in('id', itemIds)

    if (checkError || !ownershipCheck || ownershipCheck.length !== items.length) {
      return NextResponse.json({ error: 'ACESSO NEGADO: VIOLAÇÃO DE PROPRIEDADE' }, { status: 403 })
    }

    // 💎 NEXUS: Atualização em lote (Bulk Update) com segurança confirmada
    const updates = items.map(item => 
      supabaseAdmin
        .from(table)
        .update({ display_order: item.display_order })
        .eq('id', item.id)
        .eq('user_id', user.id) // Reforço de segurança
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
