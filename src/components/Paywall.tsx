'use client'

import { Gem, Lock, CheckCircle2, ShoppingBag } from 'lucide-react'

interface PaywallProps {
  onSubscribe: (plan: 'lite' | 'liteyearly' | 'monthly' | 'yearly') => void
  trialDaysLeft: number
}

export default function Paywall({ onSubscribe, trialDaysLeft }: PaywallProps) {
  return (
    <div className="fixed inset-0 bg-brand-primary/95 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[50px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 my-8">
        <div className="bg-brand-secondary/10 p-8 text-center relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-brand-primary">
            <Gem size={32} />
          </div>
          
          <div className="mt-12 space-y-1">
            <h2 className="text-xl font-black text-brand-primary uppercase tracking-tighter">Seu período de teste acabou</h2>
            <p className="text-[9px] font-black text-brand-secondary uppercase tracking-[0.2em]">Escolha seu plano para continuar brilhando 💎</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></div>
                <p className="text-[9px] font-black text-brand-secondary uppercase tracking-widest">Plano Lite (Essencial)</p>
              </div>
              <button 
                onClick={() => onSubscribe('lite')}
                className="w-full bg-rose-50/50 border border-brand-secondary/10 p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all"
              >
                <div className="text-left">
                  <p className="text-lg font-black text-brand-primary">R$ 49,90<span className="text-[10px] opacity-40">/mês</span></p>
                  <p className="text-[7px] font-bold text-brand-secondary uppercase mt-0.5 italic">Vitrine + IA Gemini</p>
                </div>
                <ShoppingBag size={18} className="text-brand-secondary/40" />
              </button>

              <button 
                onClick={() => onSubscribe('liteyearly')}
                className="w-full bg-white border-2 border-brand-secondary/20 p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all"
              >
                <div className="text-left">
                  <p className="text-lg font-black text-brand-primary">R$ 499,00<span className="text-[10px] opacity-40">/ano</span></p>
                  <p className="text-[7px] font-bold text-green-600 uppercase mt-0.5 italic">Economize R$ 99,80</p>
                </div>
                <Gem size={18} className="text-brand-secondary/40" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Plano Pro (Completo)</p>
              </div>
              <button 
                onClick={() => onSubscribe('monthly')}
                className="w-full bg-brand-primary text-white p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-lg"
              >
                <div className="text-left">
                  <p className="text-lg font-black">R$ 69,80<span className="text-[10px] opacity-40">/mês</span></p>
                  <p className="text-[7px] font-bold text-white/40 uppercase mt-0.5 italic">Tudo + Gestão Financeira</p>
                </div>
                <ShoppingBag size={18} />
              </button>

              <button 
                onClick={() => onSubscribe('yearly')}
                className="w-full bg-white border-2 border-brand-primary p-5 rounded-3xl flex items-center justify-between group hover:scale-[1.02] transition-all shadow-sm"
              >
                <div className="text-left">
                  <p className="text-lg font-black text-brand-primary">R$ 710,00<span className="text-[10px] opacity-40">/ano</span></p>
                  <p className="text-[7px] font-bold text-brand-secondary uppercase mt-0.5 italic">Economize R$ 127,60</p>
                </div>
                <Gem size={18} className="text-brand-primary/40" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-secondary/10">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                'Vitrine ilimitada',
                'IA Gemini Flash',
                'Exportação em PDF',
                'Gestão Financeira (PRO)',
                'Suporte Prioritário',
                'DNA Cromático'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <span className="text-[9px] font-medium text-brand-primary/60">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[8px] text-center text-brand-secondary/40 font-bold uppercase tracking-widest">
            Assinatura processada pela Google Play Store ou Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
