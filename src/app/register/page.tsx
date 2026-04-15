'use client'

import { Gem, Loader2, Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 💎 INTELIGÊNCIA NEXUS: CORREÇÃO AUTOMÁTICA DE ERROS DE DIGITAÇÃO
    let cleanEmail = email.trim().toLowerCase()
    if (cleanEmail.endsWith('.cor')) cleanEmail = cleanEmail.replace('.cor', '.com')
    if (cleanEmail.endsWith('.con')) cleanEmail = cleanEmail.replace('.con', '.com')
    
    const pass = password.trim()
    const confirm = confirmPassword.trim()

    if (pass !== confirm) {
      setError('As senhas não coincidem, Angela.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('ERRO REAL DO SUPABASE:', error)
        let msg = error.message
        if (msg === 'User already registered') msg = 'Este e-mail já está cadastrado.'
        if (msg.includes('email')) msg = 'E-mail inválido ou mal formatado. Verifique o .com'
        if (msg.includes('password')) msg = 'A senha deve ter pelo menos 6 caracteres.'
        if (msg.includes('Database error')) msg = 'Erro de banco de dados. Tente novamente em instantes.'
        
        setError(msg)
        return
      }

      // 💎 SE O USUÁRIO FOR CRIADO MAS PRECISAR DE CONFIRMAÇÃO
      if (data.user && data.session === null) {
        setSuccess(true)
        setError('CONTA CRIADA! Verifique seu e-mail para confirmar o acesso. 📧')
        return
      }

      // 💎 INICIALIZAÇÃO DE BRANDING (Para novas empresárias)
      if (data.user) {
        await supabase.from('branding').insert([{
          user_id: data.user.id,
          business_name: 'Lapidado',
          primary_color: '#4a322e',
          secondary_color: '#c99090',
          facebook: 'CATÁLOGO REQUINTADO|10|BEM-VINDA AO BRILHO|Lapidado', // Tagline|Parcelas|Banner|Nome
          tiktok: '6 MESES DE GARANTIA'
        }])
      }

      setSuccess(true)
      // Após 3 segundos redireciona para o login
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#fffaf9] relative overflow-hidden">
      {/* Background Decorativo Mais Vibrante */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-10 -right-10 w-[300px] h-[300px] bg-rose-200/40 rounded-full blur-3xl animate-pulse" />
         <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-[#c99090]/20 rounded-full blur-3xl" />
         <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-rose-100/50 rounded-full blur-3xl" />
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-[40px] md:rounded-[48px] shadow-[0_32px_80px_rgba(74,50,46,0.06)] w-full max-w-md border border-white/50 relative z-10 transition-all">

        <div className="text-center mb-10 relative z-10">
          <h1 className="text-[10px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-8">Catálogo Lapidado</h1>
          <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Gem className="text-[#c99090]" size={36} />
          </div>
          <h2 className="text-3xl font-bold text-[#4a322e]">Nova Empresária</h2>
          <p className="text-[#7a5c58] text-sm mt-2 font-medium">&quot;Comece hoje a lapidar o futuro do seu catálogo.&quot; 💎</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-medium text-center animate-shake">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-800 text-xs font-medium text-center">
            Conta de Empresária criada com sucesso! Redirecionando...
          </div>
        )}

        {!success && (
          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">E-mail Profissional</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
                  placeholder="angela@exemplo.com"
                />
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c99090]" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Senha Mestra</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
                  placeholder="••••••••"
                  minLength={6}
                />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c99090]" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Confirmar Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c99090]" size={18} />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-[#4a322e] text-white py-5 rounded-3xl font-bold hover:bg-[#c99090] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Criar Acesso Empresária 💎'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center relative z-10">
          <p className="text-[#7a5c58] text-sm">
            Já possui acesso?{' '}
            <Link href="/login" className="text-[#c99090] font-bold hover:underline">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
