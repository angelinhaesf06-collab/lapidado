'use client'

import { CheckCircle2, Gem, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function RegisterSuccessPage() {
  // Dispara o evento de conversão novamente por garantia ao carregar a página
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
        'value': 49.90,
        'currency': 'BRL'
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#fffaf9] relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-secondary/5 rounded-full blur-3xl -z-10 -translate-x-1/2" />

      <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-[48px] shadow-2xl border border-rose-100 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 className="text-green-500" size={60} />
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-brand-secondary">
            <Sparkles size={12} className="fill-brand-secondary" />
            <span className="text-[10px] font-black uppercase tracking-widest">Acesso Liberado</span>
          </div>
          <h1 className="text-3xl font-black text-brand-primary leading-tight">
            Bem-vinda ao seu novo <span className="text-brand-secondary">império</span>!
          </h1>
          <p className="text-[#7a5c58] font-medium leading-relaxed">
            Sua conta de Empresária foi criada com sucesso. Estamos prontos para dar o brilho que suas joias merecem.
          </p>
        </div>

        <div className="pt-4">
          <Link 
            href="/login" 
            className="w-full py-6 rounded-3xl bg-brand-primary text-white font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Acessar Meu Painel <ArrowRight size={20} />
          </Link>
        </div>

        <div className="pt-6 border-t border-rose-50 flex items-center justify-center gap-2 text-[10px] font-black text-brand-secondary/40 uppercase tracking-widest">
          <Gem size={14} /> Lapidado 2026
        </div>
      </div>
    </div>
  )
}
