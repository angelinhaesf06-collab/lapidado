import React from 'react'
import { Lock, Shield, Gem, ArrowLeft, Cookie } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Política de Cookies | Lapidado',
  description: 'Saiba como utilizamos cookies para melhorar sua experiência.',
}

export default function PoliticaCookies() {
  return (
    <div className="min-h-[100svh] bg-[#fffcfc] py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        
        {/* Botão Voltar */}
        <div className="flex justify-start">
          <Link 
            href="/admin/policies" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary hover:text-brand-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao Painel
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-secondary/10 rounded-full text-brand-primary mb-4">
            <Cookie size={32} />
          </div>
          <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tighter">Política de Cookies</h1>
          <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">Última atualização: 11 de maio de 2026</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-brand-secondary/10 shadow-sm space-y-8 text-brand-primary/80 leading-relaxed">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Shield size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">1. O que são Cookies?</h2>
            </div>
            <p className="text-sm">
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo para melhorar a funcionalidade do site, lembrar suas preferências e facilitar o login.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Lock size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">2. Como utilizamos?</h2>
            </div>
            <p className="text-sm">
              No **Lapidado**, utilizamos cookies estritamente necessários para:
            </p>
            <ul className="list-disc ml-6 space-y-2 text-sm">
              <li>Manter sua sessão de login ativa de forma segura.</li>
              <li>Lembrar configurações de filtros e visualização do catálogo.</li>
              <li>Garantir a integridade das transações financeiras.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-brand-primary">
              <Gem size={20} />
              <h2 className="text-lg font-black uppercase tracking-tight">3. Controle do Usuário</h2>
            </div>
            <p className="text-sm">
              Você pode desativar os cookies nas configurações do seu navegador ou celular, porém isso pode afetar a funcionalidade do painel administrativo.
            </p>
          </section>

          <div className="pt-8 border-t border-brand-secondary/10 text-center">
            <p className="text-[11px] font-bold text-brand-secondary uppercase">
              Contato: angelinhaesf06@gmail.com
            </p>
          </div>
        </div>

        <div className="text-center opacity-20">
          <Gem className="mx-auto" size={24} />
        </div>
      </div>
    </div>
  )
}
