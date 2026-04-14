import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { table, id, imageUrl } = await req.json()
    const authHeader = req.headers.get('authorization')

    const VALID_TOKEN = 'Bearer LAPIDADO_ADMIN_2026'
    if (authHeader !== VALID_TOKEN) {
      return NextResponse.json({ error: 'ACESSO NEGADO' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Se houver imagem, remover do Storage primeiro
    if (imageUrl) {
      const path = imageUrl.split('/').pop()
      if (path) {
        await supabaseAdmin.storage.from('products').remove([path])
      }
    }

    // 2. Remover do Banco de Dados
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id)
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
