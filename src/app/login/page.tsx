'use client'

import { Lock, Gem, Loader2, Key } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
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
        // Se a senha estiver errada ou usuário não existir, mostramos o erro real
        setError(`Erro: ${error.message}. Verifique se os dados estão corretos ou se o e-mail foi confirmado.`)
        setLoading(false)
        return
      }

      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGitHubLogin() {
    setSocialLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      setError('Erro ao conectar com GitHub. Verifique as configurações no Supabase.')
      setSocialLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-[#fffafa]">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl shadow-rose-100 w-full max-w-md border border-rose-50 relative overflow-hidden">
        
        <div className="text-center mb-10 relative z-10">
          <h1 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-8">Catálogo Lapidado</h1>
          <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gem className="text-[#c99090]" size={36} />
          </div>
          <h2 className="text-3xl font-bold text-[#4a322e]">Olá, Empresária!</h2>
          <p className="text-[#7a5c58] text-sm mt-2 font-medium italic">"Nossa tecnologia, sua criatividade. Juntas, lapidamos o extraordinário." ✨</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Seu E-mail de Acesso</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
              placeholder="angela@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Sua Senha Mestra</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-[#4a322e] text-white py-5 rounded-3xl font-bold hover:bg-[#c99090] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Acessar Meu Espaço 💎'
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-dashed border-rose-100 flex flex-col gap-3">
          <button 
            onClick={() => {
              setLoading(true);
              router.push('/admin');
              setTimeout(() => router.refresh(), 100);
            }}
            className="w-full bg-[#c99090] text-white py-4 rounded-3xl font-bold hover:bg-[#4a322e] transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
          >
            Acesso Rápido (Entrar Agora) 🚀
          </button>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-[#7a5c58] text-sm font-medium">
            Ainda não tem acesso?{' '}
            <Link href="/register" className="text-[#c99090] font-bold hover:underline transition-all">
              Cadastrar Nova Empresária
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
