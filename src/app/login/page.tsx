'use client'

import { Gem, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Ocorreu um erro ao acessar como visitante.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] flex items-center justify-center px-4 bg-[#fffaf9] relative overflow-hidden">
      {/* Background Decorativo Mais Vibrante */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-10 -left-10 w-[300px] h-[300px] bg-rose-200/40 rounded-full blur-3xl animate-pulse" />
         <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-[#c99090]/20 rounded-full blur-3xl" />
         <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-rose-100/50 rounded-full blur-3xl" />
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-6 md:p-12 rounded-[40px] md:rounded-[56px] shadow-[0_32px_80px_rgba(74,50,46,0.06)] w-full max-w-lg border border-white/50 relative z-10 transition-all">
        
        {/* Branding Elegante */}
        <div className="text-center mb-8 md:mb-12 flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#4a322e] tracking-tight mb-2 md:mb-3">Seu Espaço</h2>
          <p className="text-[#8b6e6a] text-[12px] md:text-[13px] font-medium tracking-wide">
            &quot;Sua visão lapidada com perfeição.&quot;
          </p>
        </div>

        {/* Alerta de Erro Refinado */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50/50 border-l-4 border-rose-200 rounded-xl text-[#7a5c58] text-[11px] font-bold uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 duration-300">
             ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6 md:space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.3em] ml-2 block opacity-80">E-mail de Acesso</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[24px] md:rounded-[28px] bg-[#fffaf9]/50 border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none transition-all text-[#4a322e] text-sm font-semibold placeholder:text-stone-300 shadow-inner"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.3em] ml-2 block opacity-80">Senha Mestra</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 md:px-8 py-4 md:py-5 rounded-[24px] md:rounded-[28px] bg-[#fffaf9]/50 border-2 border-transparent focus:border-rose-100 focus:bg-white outline-none transition-all text-[#4a322e] text-sm font-semibold placeholder:text-stone-300 shadow-inner"
              placeholder="••••••••"
            />
          </div>

          {/* Botão de Ação Sólido */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#4a322e] text-white py-5 md:py-6 rounded-[28px] md:rounded-[32px] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-2xl shadow-rose-200/50 hover:bg-[#c99090] hover:shadow-rose-300/40 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center px-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <div className="flex items-center gap-2 md:gap-3 max-w-full">
                <span className="truncate">Acessar Meu Acervo</span> 
                <Gem size={16} className="shrink-0" />
              </div>
            )}
          </button>
        </form>

        {/* 🚀 ACESSO VISITANTE / TESTE */}
        <div className="mt-4 md:mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="h-[1px] bg-rose-100 flex-1" />
            <span className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] opacity-60">ou</span>
            <div className="h-[1px] bg-rose-100 flex-1" />
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full border-2 border-[#c99090]/30 text-[#c99090] py-4 md:py-5 rounded-[24px] md:rounded-[28px] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] hover:bg-[#c99090]/5 hover:border-[#c99090] transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>Acesso Visitante / Teste</span>
                <Gem size={14} className="group-hover:animate-bounce" />
              </>
            )}
          </button>
        </div>

        {/* 💎 ACESSO PARA NOVAS EMPRESÁRIAS */}
        <div className="mt-8 md:mt-12 text-center border-t border-rose-50 pt-6 md:pt-8">
          <p className="text-[#8b6e6a] text-[11px] font-semibold uppercase tracking-widest">
            Ainda não é parceira?{' '}
            <Link href="/register" className="text-[#c99090] font-black hover:opacity-80 transition-opacity">
              Começar Agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
