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
    
    // LÓGICA INTELIGENTE PARA BRANDING: Sempre opera no único registro existente
    if (table === 'branding') {
      // Tenta buscar o primeiro registro para obter o ID caso ele não tenha sido enviado
      const { data: existing } = await supabaseAdmin.from('branding').select('id').limit(1).single();
      
      if (existing?.id || id) {
        // Se existe um registro ou temos o ID, faz o update
        result = await supabaseAdmin.from(table).update(data).eq('id', existing?.id || id).select();
      } else {
        // Se a tabela estiver vazia, faz o primeiro insert
        result = await supabaseAdmin.from(table).insert([data]).select();
      }
    } else if (id) {
      // UPDATE para tabelas com ID específico (Produtos, Categorias)
      result = await supabaseAdmin.from(table).update(data).eq('id', id).select()
    } else {
      // INSERT para novos registros
      result = await supabaseAdmin.from(table).insert([data]).select()
    }

    if (result.error) throw result.error

    return NextResponse.json({ success: true, data: result.data })

  } catch (err) {
    const error = err as Error
    console.error('ERRO NO SALVAMENTO:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
