import React from 'react'
import { Trash2, ShieldAlert, Mail, Gem } from 'lucide-react'

export const metadata = {
  title: 'Exclusão de Conta | Lapidado',
  description: 'Saiba como solicitar a exclusão definitiva dos seus dados.',
}

export default function ExcluirConta() {
  return (
    <div className="min-h-screen bg-[#fffcfc] py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
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
              Ao solicitar a exclusão da sua conta no **Lapidado**, as seguintes informações serão removidas permanentemente de nossos servidores após o processamento:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-sm text-brand-primary/70">
              <li>Seu perfil de usuário (nome e e-mail).</li>
              <li>Todo o catálogo de produtos e imagens associadas.</li>
              <li>Histórico de vendas, registros de clientes e dados financeiros.</li>
              <li>Configurações de marca e personalização de vitrine.</li>
            </ul>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
              Atenção: Esta ação é irreversível.
            </p>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 text-brand-primary">
              <Mail size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">Como solicitar</h2>
            </div>
            <p className="text-sm text-brand-primary/70">
              Para garantir a segurança dos seus dados e confirmar a titularidade da conta, as solicitações de exclusão devem ser feitas via e-mail:
            </p>
            
            <div className="bg-rose-50/30 p-6 rounded-3xl border border-rose-100 text-center">
              <p className="text-xs font-black text-brand-primary uppercase mb-2">Envie um e-mail para:</p>
              <p className="text-lg font-black text-rose-600">suporte@lapidado.com.br</p>
              <p className="text-[9px] font-bold text-brand-secondary uppercase mt-2">Assunto: Solicitação de Exclusão de Conta</p>
            </div>

            <p className="text-xs text-brand-primary/70 italic text-center">
              Nosso suporte processará sua solicitação e confirmará a exclusão definitiva em até 7 dias úteis.
            </p>
          </section>

        </div>

        <div className="text-center opacity-20">
          <Gem className="mx-auto" size={24} />
        </div>
      </div>
    </div>
  )
}
