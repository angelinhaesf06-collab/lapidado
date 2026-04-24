import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'products'

    if (!file) return NextResponse.json({ error: 'NENHUM ARQUIVO' }, { status: 400 })

    // 🚀 BYPASS SUPREME: Usa Service Role para ignorar QUALQUER trava de segurança (RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const fileName = `admin_${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
    const buffer = Buffer.from(await file.arrayBuffer());

    // O segredo está em usar o cliente ADMIN aqui
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Falha crítica no bucket:', error.message)
      return NextResponse.json({ error: `SUPABASE_BLOCK: ${error.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
