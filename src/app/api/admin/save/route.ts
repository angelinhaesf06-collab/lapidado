import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'; // 💎 NEXUS: Garantindo compatibilidade total

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      const missing = !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : 'SUPABASE_SERVICE_ROLE_KEY';
      console.error(`❌ ERRO: VARIÁVEL ${missing} AUSENTE NA VERCEL.`);
      return NextResponse.json({ 
        error: `SERVIDOR NÃO CONFIGURADO (CHAVE ${missing} AUSENTE)`, 
        details: 'Adicione esta chave no painel da Vercel e faça o Redeploy.' 
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

    // 💎 NEXUS: VALIDAÇÃO DE SEGURANÇA MULTI-TENANT
    // Para operações via Client SDK, o RLS cuida disso. 
    // Como estamos usando Service Role (Admin), precisamos garantir o isolamento manualmente.
    if (data.user_id && id) {
       // Se estamos editando, o registro DEVE pertencer ao user_id enviado
       const { data: check } = await supabaseAdmin.from(table).select('user_id').eq('id', id).single();
       if (check && check.user_id !== data.user_id) {
         return NextResponse.json({ error: 'VIOLAÇÃO DE ISOLAMENTO: Registro pertence a outra marca.' }, { status: 403 });
       }
    }

    // GERAR SLUG AUTOMÁTICO PARA CATEGORIAS (ISOALDO POR USER)
    if (table === 'categories' && data.name) {
      data.slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()
    }

    let result;
    
    // LÓGICA INTELIGENTE PARA BRANDING: Sempre opera no único registro existente
    if (table === 'branding') {
      // Tenta buscar o primeiro registro para obter o ID caso ele não tenha sido enviado
      const { data: existing } = await supabaseAdmin.from('branding').select('id').limit(1).maybeSingle();
      
      console.log('💎 NEXUS: VERIFICANDO REGISTRO EXISTENTE...', existing?.id);

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

    if (result.error) {
      console.error('❌ ERRO CRÍTICO NO SUPABASE:', result.error.message);
      throw result.error;
    }

    // INVALIDAÇÃO DE CACHE ESTRATÉGICA
    revalidatePath('/')
    revalidatePath('/admin/products')
    if (id && table === 'products') {
      revalidatePath(`/product/${id}`)
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (err) {
    const error = err as Error
    console.error('ERRO NO SALVAMENTO:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
