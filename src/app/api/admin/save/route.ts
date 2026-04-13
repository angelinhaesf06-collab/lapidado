import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { table, data, id } = await req.json()
    const authHeader = req.headers.get('authorization')

    // CHAVE ÚNICA E INFALÍVEL
    const VALID_TOKEN = 'Bearer LAPIDADO_ADMIN_2026'

    if (authHeader !== VALID_TOKEN) {
      console.error('ERRO: TOKEN RECEBIDO INVÁLIDO:', authHeader)
      return NextResponse.json({ error: 'ACESSO NEGADO' }, { status: 401 })
    }

    if (!table || !data) {
      return NextResponse.json({ error: 'DADOS INCOMPLETOS' }, { status: 400 })
    }

    // Usamos as chaves apenas para a CONEXÃO com o banco, não para a validação
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // GERAR SLUG AUTOMÁTICO PARA CATEGORIAS
    if (table === 'categories' && data.name) {
      data.slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()
    }

    let result;
    
    // LÓGICA UPSERT: Se for branding, tentamos atualizar o registro existente ou criar um novo
    if (table === 'branding') {
      // No branding, geralmente só temos um registro. 
      // Se não houver ID, tentamos o upsert baseado na restrição de unicidade.
      result = await supabaseAdmin
        .from(table)
        .upsert(data, { onConflict: 'id' })
        .select()
    } else if (id) {
      // UPDATE para tabelas com ID específico (Produtos, Categorias)
      result = await supabaseAdmin.from(table).update(data).eq('id', id).select()
    } else {
      // INSERT para novos registros
      result = await supabaseAdmin.from(table).insert([data]).select()
    }

    if (result.error) throw result.error

    return NextResponse.json({ success: true, data: result.data })

  } catch (err: any) {
    console.error('ERRO NO SALVAMENTO:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
