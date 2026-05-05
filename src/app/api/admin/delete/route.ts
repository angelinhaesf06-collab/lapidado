import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { table, id, imageUrl } = await req.json()
    
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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 🔒 CHECAGEM DE PROPRIEDADE: Garantir que o usuário só delete o que é dele
    const { data: check } = await supabaseAdmin.from(table).select('user_id').eq('id', id).single()
    if (check && check.user_id && check.user_id !== user.id) {
       return NextResponse.json({ error: 'VIOLAÇÃO DE ISOLAMENTO: Registro pertence a outra marca.' }, { status: 403 })
    }

    // 1. Se houver imagem, remover do Storage primeiro
    if (imageUrl) {
      const path = imageUrl.split('/').pop()
      if (path) {
        await supabaseAdmin.storage.from(table === 'branding' ? 'branding' : 'products').remove([path])
      }
    }

    // 2. Remover do Banco de Dados
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error

    // INVALIDAÇÃO DE CACHE ESTRATÉGICA
    revalidatePath('/')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true })

  } catch (err) {
    const error = err as Error
    console.error('ERRO NA EXCLUSÃO:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
