'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/admin'

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.push(next)
          return
        }
      }
      
      router.push('/login?error=auth-code-error')
    }

    handleAuth()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffafa]">
      <div className="p-12 rounded-[60px] bg-white shadow-2xl shadow-rose-100 text-center border border-rose-50">
        <Loader2 className="animate-spin text-brand-secondary mx-auto mb-6" size={40} />
        <h2 className="text-xl font-bold text-brand-primary uppercase tracking-widest">
          Verificando Credenciais... 💎
        </h2>
        <p className="text-brand-secondary text-[10px] font-black uppercase tracking-[0.2em] mt-4 opacity-60">
          Lapidando seu acesso exclusivo
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
            <AuthCallbackContent />
        </Suspense>
    )
}
