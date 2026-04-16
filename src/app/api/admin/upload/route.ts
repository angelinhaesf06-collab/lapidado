import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'products'

    if (!file) {
      return NextResponse.json({ error: 'NENHUM ARQUIVO ENVIADO' }, { status: 400 })
    }

    // Criar cliente com Chave Mestra (Service Role) - APENAS NO SERVIDOR
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Converter para Buffer para garantir compatibilidade no ambiente Node.js do Next.js
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload usando a permissão master
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName)

    // 💎 NEXUS: Cache-Buster (Timestamp) para forçar atualização visual imediata
    const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`

    return NextResponse.json({ url: urlWithCacheBuster })

  } catch (err) {
    const error = err as Error
    console.error('ERRO NO UPLOAD SEGURO:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
