'use client'

import { useState } from 'react'
import { Gem, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AtivarPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const ativarBanco = async () => {
    setLoading(true)
    setStatus('idle')
    
    try {
      // 1. Cadastrar as categorias luxuosas
      const categories = [
        { name: 'Anel', slug: 'anel' },
        { name: 'Brinco', slug: 'brinco' },
        { name: 'Corrente', slug: 'corrente' },
        { name: 'Conjunto', slug: 'conjunto' },
        { name: 'Pulseira', slug: 'pulseira' },
        { name: 'Tornozeleira', slug: 'tornozeleira' }
      ]

      console.log('💎 Lapidando categorias...')
      const { error: catError } = await supabase.from('categories').upsert(categories, { onConflict: 'name' })
      
      if (catError) throw catError

      setStatus('success')
      setMessage('O banco de dados e as categorias foram lapidados com sucesso! ✨')
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error("Erro na ativação:", error)
      setStatus('error')
      setMessage(`Erro: ${error.message}. Certifique-se de que as tabelas existem no Supabase.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffafa] px-4">
      <div className="bg-white p-12 rounded-[60px] shadow-2xl shadow-rose-100 max-w-md w-full text-center border border-rose-50">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <Gem className="text-[#c99090]" size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-[#4a322e] mb-4">Ativação Lapidado</h1>
        <p className="text-[#7a5c58] text-sm mb-10 leading-relaxed">
          Clique no botão abaixo para verificar se o seu acervo de joias está pronto para ser preenchido.
        </p>

        {status === 'success' && (
          <div className="mb-8 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 text-xs font-medium">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {status === 'error' && (
          <div className="mb-8 p-4 bg-amber-50 text-amber-800 rounded-2xl flex items-center gap-3 text-xs font-medium text-left">
            <AlertTriangle size={32} className="shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <button 
          onClick={ativarBanco}
          disabled={loading}
          className="w-full py-5 rounded-[32px] bg-[#4a322e] text-white font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-[#c99090] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar Acervo 💎'}
        </button>

        <div className="mt-8">
          <a href="/admin" className="text-[#c99090] text-xs font-bold hover:underline">Voltar para o Espaço da Empresária</a>
        </div>
      </div>
    </div>
  )
}
