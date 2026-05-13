'use client'

import { Shield, FileText, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function PoliciesPage() {
  const policies = [
    { title: 'Termos de Uso', icon: FileText, href: '/termos', desc: 'Regras gerais de utilização da plataforma Lapidado.' },
    { title: 'Política de Privacidade', icon: Shield, href: '/privacidade', desc: 'Como cuidamos e protegemos os seus dados e os dos seus clientes.' },
    { title: 'Política de Cookies', icon: Lock, href: '/politica', desc: 'Informações sobre como utilizamos cookies para melhorar sua experiência.' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Políticas e Segurança</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Transparência e confiança em cada detalhe 💎</p>
      </div>

      <div className="space-y-4">
        {policies.map((policy, i) => (
          <Link 
            key={i} 
            href={policy.href} 
            className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm hover:border-brand-primary transition-all group flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-brand-secondary/5 rounded-[20px] flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-sm">
              <policy.icon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-brand-primary mb-1">{policy.title}</h3>
              <p className="text-[10px] font-medium text-brand-secondary/70">{policy.desc}</p>
            </div>
            <ChevronRight size={20} className="text-brand-secondary/30 group-hover:text-brand-primary transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      <div className="mt-16 p-8 bg-rose-50/20 rounded-[40px] border border-brand-secondary/5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-4">Compromisso Lapidado</h4>
        <p className="text-xs text-brand-primary/60 leading-relaxed italic">
          &quot;Acreditamos que a segurança é a base para o crescimento do seu negócio. Nossas políticas são revisadas periodicamente para garantir conformidade com a LGPD e as melhores práticas do mercado digital de luxo.&quot;
        </p>
      </div>
    </div>
  )
}
