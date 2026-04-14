import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('❌ ERRO CRÍTICO: SUPABASE KEYS FALTANDO NO NAVEGADOR! Verifique as variáveis de ambiente na Vercel.')
    // Em produção, queremos que o erro seja visível para diagnóstico
  }

  return createBrowserClient(
    url || 'https://MISSING-URL.supabase.co',
    key || 'MISSING-KEY'
  )
}
