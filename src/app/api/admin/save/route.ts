import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'; // 💎 NEXUS: Garantindo compatibilidade total

export async function POST(req: Request) {
  let result;
  try {
    const { table, data, id } = await req.json()
    
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
      console.error('ERRO: SESSÃO INVÁLIDA OU EXPIRADA');
      return NextResponse.json({ error: 'ACESSO NEGADO: SESSÃO INVÁLIDA' }, { status: 401 })
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

    // 💎 NEXUS: SEGURANÇA MÁXIMA MULTI-TENANT
    // Forçamos o user_id da sessão para garantir que um usuário não salve dados em nome de outro.
    if (data.user_id && data.user_id !== user.id) {
       return NextResponse.json({ error: 'VIOLAÇÃO DE IDENTIDADE: user_id diverge da sessão.' }, { status: 403 });
    }
    data.user_id = user.id;

    if (id) {
       // Se estamos editando, o registro DEVE pertencer ao user_id da sessão
       const { data: check } = await supabaseAdmin.from(table).select('user_id').eq('id', id).single();
       
       if (check && check.user_id && check.user_id !== user.id) {
         return NextResponse.json({ error: 'VIOLAÇÃO DE ISOLAMENTO: Registro pertence a outra marca.' }, { status: 403 });
       }
    }

    // GERAR SLUG AUTOMÁTICO PARA CATEGORIAS (ISOALDO POR USER)
    if (table === 'categories' && data.name) {
      data.slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()
    }

    // 🚀 LÓGICA DEFINITIVA PARA BRANDING: 1 Registro por Usuário + Geração de Slug Robusta
    if (table === 'branding') {
      const userId = data.user_id;

      // Garantir que o slug exista e seja único
      if (!data.slug && data.business_name) {
        data.slug = data.business_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      }
      
      // Upsert baseado no user_id (Garante que cada marca tenha apenas uma config)
      const { data: existing } = await supabaseAdmin
        .from('branding')
        .select('id, slug')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        console.log('💎 NEXUS: ATUALIZANDO BRANDING EXISTENTE:', existing.id);
        
        // 💎 Garantir que o slug nunca seja nulo ou vazio se o nome existir
        if ((!data.slug || data.slug === '' || data.slug === 'lapidado') && (data.business_name || data.store_name)) {
          const baseName = data.business_name || data.store_name;
          if (baseName && baseName.toUpperCase() !== 'LAPIDADO') {
            data.slug = baseName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          }
        }

        // Se o slug mudou (ou foi gerado agora), verificamos se ele já existe em OUTRA marca para evitar erro de UNIQUE
        if (data.slug && data.slug !== existing.slug) {
          const { data: conflict } = await supabaseAdmin.from('branding').select('id').eq('slug', data.slug).neq('id', existing.id).maybeSingle();
          if (conflict) {
            data.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`; // Resolve conflito adicionando rastro aleatório
          }
        }

        // 💎 Garantir que o updated_at seja atualizado para refletir a mudança imediata
        data.updated_at = new Date().toISOString();

        result = await supabaseAdmin.from(table).update(data).eq('id', existing.id).select();
      } else {
        console.log('💎 NEXUS: CRIANDO NOVO BRANDING PARA USER:', userId);
        
        // Verificação de conflito para novo registro
        if (data.slug) {
           const { data: conflict } = await supabaseAdmin.from('branding').select('id').eq('slug', data.slug).maybeSingle();
           if (conflict) {
             data.slug = `${data.slug}-${Math.floor(Math.random() * 1000)}`;
           }
        } else {
           data.slug = `loja-${crypto.randomUUID().substring(0, 8)}`;
        }

        result = await supabaseAdmin.from(table).insert([{ ...data, id: crypto.randomUUID() }]).select();
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
