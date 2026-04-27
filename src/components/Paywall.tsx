'use client'

import { Gem, Lock, CheckCircle2, ShoppingBag } from 'lucide-react'

interface PaywallProps {
  onSubscribe: (plan: 'monthly' | 'yearly') => void
  trialDaysLeft: number
}

export default function Paywall({ onSubscribe, trialDaysLeft }: PaywallProps) {
  return (
    <div className="fixed inset-0 bg-brand-primary/95 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="bg-brand-secondary/10 p-10 text-center relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-brand-primary">
            <Gem size={40} />
          </div>
          
          <div className="mt-16 space-y-2">
            <h2 className="text-2xl font-black text-brand-primary uppercase tracking-tighter">Seu período de teste acabou</h2>
            <p className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.2em]">Continue brilhando com o Lapidado Pro</p>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-medium text-brand-primary/70">Gestão ilimitada de produtos e estoque.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-medium text-brand-primary/70">IA de elite (Gemini 3 Flash) para descrições luxuosas.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-xs font-medium text-brand-primary/70">Controle financeiro e emissão de promissórias.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => onSubscribe('monthly')}
              className="w-full bg-brand-primary text-white p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl"
            >
              <div className="text-left">
                <p className="text-[10px] font-black uppercase opacity-60">Plano Mensal</p>
                <p className="text-xl font-black tracking-tight">R$ 49,90 <span className="text-xs opacity-60">/mês</span></p>
              </div>
              <ShoppingBag className="group-hover:rotate-12 transition-transform" />
            </button>

            <button 
              onClick={() => onSubscribe('yearly')}
              className="w-full border-2 border-brand-primary text-brand-primary p-6 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all"
            >
              <div className="text-left">
                <p className="text-[10px] font-black uppercase opacity-60 text-brand-secondary">Plano Anual (Economize 20%)</p>
                <p className="text-xl font-black tracking-tight">R$ 479,00 <span className="text-xs opacity-60">/ano</span></p>
              </div>
              <Gem className="group-hover:scale-110 transition-transform text-brand-secondary" />
            </button>
          </div>

          <p className="text-[9px] text-center text-brand-secondary/40 font-bold uppercase tracking-widest">
            Assinatura processada de forma segura pelo Google Play
          </p>
        </div>
      </div>
    </div>
  )
}
