import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { table, data, action, id } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Ação de Exclusão
    if (action === 'delete' && id) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // Ação de Atualização/Upsert (Especial para Branding)
    if (table === 'branding') {
      const { data: result, error } = await supabase
        .from('branding')
        .upsert({ id: '00000000-0000-0000-0000-000000000000', ...data })
        .select()
        .single()
      
      if (error) throw error
      return NextResponse.json({ success: true, data: result })
    }

    // Ação de Inserção Padrão
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('ERRO NA API DE ADMIN:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
