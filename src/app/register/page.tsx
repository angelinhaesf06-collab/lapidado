'use client'

import { Gem, Loader2, Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [waitingConfirmation, setWaitingConfirmation] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const router = useRouter()
  const supabase = createClient()

  async function handleResendEmail() {
    setResending(true)
    setResendStatus('idle')
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      })
      if (error) throw error
      setResendStatus('success')
    } catch (err) {
      console.error('Erro ao reenviar:', err)
      setResendStatus('error')
    } finally {
      setResending(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    
    // 💎 DIAGNÓSTICO DE AMBIENTE VERCEL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl.includes('MISSING') || !supabaseKey) {
      setError('ERRO DE AMBIENTE: As chaves do Supabase não foram detectadas. Por favor, faça um REDEPLOY na Vercel para ativar as variáveis de ambiente. 🚀')
      return
    }

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error('ERRO REAL DO SUPABASE:', signUpError)
        let msg = signUpError.message
        if (msg === 'User already registered') msg = 'Este e-mail já está cadastrado.'
        if (msg.includes('email')) msg = 'E-mail inválido ou mal formatado. Verifique o .com'
        if (msg.includes('password')) msg = 'A senha deve ter pelo menos 6 caracteres.'
        
        setError(msg)
        return
      }

      // 💎 WHITE-LABEL: Criar entrada inicial de branding com o nome da loja
      if (data.user) {
        const { error: brandingError } = await supabase.from('branding').insert({
          user_id: data.user.id,
          store_name: storeName.trim().toUpperCase(),
          primary_color: '#4a322e', // Padrão luxo
          secondary_color: '#c99090'
        })

        if (brandingError) {
          console.error('Erro ao salvar branding:', brandingError)
          // Não bloqueia o registro se o branding falhar, mas loga o erro
        }
      }

      // 💎 SE PRECISAR DE CONFIRMAÇÃO DE E-MAIL
      if (data.user && data.session === null) {
        setWaitingConfirmation(true)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
      
    } catch (err) {
      console.error('ERRO CAPTURADO:', err)
      const errorMsg = (err as Error).message || ''
      
      if (errorMsg.includes('fetch') || errorMsg.includes('Network')) {
        setError('ERRO DE CONEXÃO: Não foi possível alcançar o servidor. Verifique se as chaves do Supabase foram configuradas na Vercel. 🔗')
      } else {
        setError(`ERRO INESPERADO: ${errorMsg}`)
      }
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

        {waitingConfirmation ? (
          <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Mail className="text-[#c99090]" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-[#4a322e] mb-4">Verifique seu e-mail</h2>
            <p className="text-[#7a5c58] text-sm mb-8 leading-relaxed px-4">
              Enviamos um link de ativação para:<br/>
              <strong className="text-[#c99090]">{email}</strong><br /><br />
              Clique no link para liberar seu acesso ao catálogo.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full bg-[#fdf2f0] text-[#c99090] py-4 rounded-3xl font-bold hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resending ? <Loader2 className="animate-spin" size={18} /> : 'Reenviar e-mail de confirmação'}
              </button>
              
              {resendStatus === 'success' && (
                <p className="text-green-600 text-[10px] font-bold uppercase tracking-wider animate-bounce">E-mail reenviado com sucesso! 💎</p>
              )}
              {resendStatus === 'error' && (
                <p className="text-rose-600 text-[10px] font-bold uppercase tracking-wider">Erro ao reenviar. Tente novamente.</p>
              )}
            </div>

            <button 
               onClick={() => setWaitingConfirmation(false)}
               className="mt-8 text-[#7a5c58] text-xs hover:underline font-medium"
            >
              Voltar para o cadastro
            </button>
          </div>
        ) : (
          <>
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
                  <label className="block text-[10px] font-black text-[#c99090] uppercase tracking-[0.2em] mb-2 ml-2">Nome da sua Marca ou Loja</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-3xl bg-rose-50/50 border-2 border-transparent focus:border-[#c99090] focus:bg-white outline-none transition-all text-[#4a322e]"
                      placeholder="EX: ANGELA SEMIJOIAS"
                    />
                    <Gem className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c99090]" size={18} />
                  </div>
                </div>

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
          </>
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
