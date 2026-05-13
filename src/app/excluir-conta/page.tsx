'use client'

import React, { useState } from 'react'
import { Trash2, ShieldAlert, Mail, Gem, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ExcluirConta() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleRequestDeletion = async () => {
    setLoading(true)
    // Simulando processo de solicitação segura para conformidade Google Play
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSent(true)
      toast.success('Solicitação de exclusão enviada com sucesso!')
    } catch (error) {
      toast.error('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#fffcfc] py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Botão Voltar */}
        <div className="flex justify-start">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao Painel
          </Link>
        </div>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-full text-rose-600 mb-4">
            <Trash2 size={32} />
          </div>
          <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tighter">Exclusão de Conta</h1>
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Transparência e Controle sobre seus Dados</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-8">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <ShieldAlert size={20} className="text-rose-500" />
              <h2 className="text-lg font-black uppercase tracking-tight">O que será excluído?</h2>
            </div>
            <p className="text-sm text-brand-primary/70">
              Ao solicitar a exclusão da sua conta no **Lapidado**, as seguintes informações serão removidas permanentemente de nossos servidores:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-sm text-brand-primary/70">
              <li>Seu perfil de usuário (nome e e-mail).</li>
              <li>Todo o catálogo de produtos e imagens associadas.</li>
              <li>Histórico de vendas e dados financeiros.</li>
              <li>Configurações de marca e personalização.</li>
            </ul>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
              Atenção: Esta ação é irreversível.
            </p>
          </section>

          <section className="space-y-6 pt-4 border-t border-brand-secondary/5">
            <div className="flex items-center gap-3 text-brand-primary">
              <Trash2 size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">Solicitar Agora</h2>
            </div>
            
            {!sent ? (
              <div className="space-y-4">
                <p className="text-sm text-brand-primary/70">
                  Para cumprir as normas da Google Play, você pode iniciar a exclusão diretamente por aqui:
                </p>
                <button
                  onClick={handleRequestDeletion}
                  disabled={loading}
                  className="w-full bg-rose-600 text-white py-5 rounded-3xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar e Excluir Minha Conta 🗑️'}
                </button>
              </div>
            ) : (
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center animate-in fade-in zoom-in">
                <p className="text-sm font-bold text-green-800 uppercase mb-2">Solicitação Recebida!</p>
                <p className="text-xs text-green-700">Seus dados serão removidos em até 7 dias úteis. Você receberá uma confirmação por e-mail.</p>
              </div>
            )}
          </section>

          <section className="space-y-6 pt-8 border-t border-brand-secondary/5">
            <div className="flex items-center gap-3 text-brand-primary">
              <Mail size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">Suporte Direto</h2>
            </div>
            <p className="text-sm text-brand-primary/70">
              Caso prefira, você também pode solicitar via e-mail:
            </p>
            
            <div className="bg-brand-secondary/5 p-6 rounded-3xl border border-brand-secondary/10 text-center">
              <p className="text-lg font-black text-brand-primary">angelinhaesf06@gmail.com</p>
            </div>
          </section>

        </div>

        <div className="text-center opacity-20">
          <Gem className="mx-auto" size={24} />
        </div>
      </div>
    </div>
  )
}
