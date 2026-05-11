'use client'

import { HelpCircle, MessageCircle, FileText, ExternalLink, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    { 
      question: 'Como cadastrar minha marca?', 
      answer: 'Vá na aba "Minha Marca", preencha o nome da sua loja e envie seu logotipo. O sistema extrairá as cores automaticamente.' 
    },
    { 
      question: 'Como funciona a IA Mágica?', 
      answer: 'Ao cadastrar um produto, envie uma foto nítida. A IA Gemini analisará a peça e escreverá uma descrição luxuosa para você.' 
    },
    { 
      question: 'Como divulgar meu catálogo?', 
      answer: 'No topo do painel, clique em "Divulgar Whats". O sistema gerará um link personalizado da sua loja para enviar aos clientes.' 
    },
    { 
      question: 'O cliente pode comprar direto pelo site?', 
      answer: 'Sim! O cliente adiciona à sacola e, ao finalizar, os dados do pedido e endereço são enviados diretamente para o seu WhatsApp.' 
    }
  ]

  const supportLinks = [
    { 
      title: 'Suporte via WhatsApp', 
      desc: 'Fale com nossa equipe técnica agora.', 
      icon: MessageCircle, 
      color: 'bg-green-500',
      href: 'https://wa.me/5511999999999' // Substituir pelo número real
    },
    { 
      title: 'E-mail de Suporte', 
      desc: 'suporte@lapidado.com.br', 
      icon: HelpCircle, 
      color: 'bg-brand-secondary',
      href: 'mailto:suporte@lapidado.com.br'
    },
    { 
      title: 'Guia de Uso PDF', 
      desc: 'Baixe o manual completo do sistema.', 
      icon: FileText, 
      color: 'bg-brand-primary',
      href: '/manual-lapidado.pdf'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight uppercase text-brand-primary">Ajuda e Suporte</h2>
        <p className="text-brand-secondary text-[10px] font-black tracking-[0.4em] uppercase mt-2">Estamos aqui para lapidar sua experiência 💎</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {supportLinks.map((link, i) => (
          <a 
            key={i} 
            href={link.href} 
            target="_blank" 
            className="bg-white p-8 rounded-[40px] border border-brand-secondary/10 shadow-sm hover:border-brand-primary transition-all group flex items-center gap-6"
          >
            <div className={`w-16 h-16 ${link.color} rounded-[24px] flex items-center justify-center text-white shadow-lg`}>
              <link.icon size={32} />
            </div>
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-brand-primary mb-1">{link.title}</h3>
              <p className="text-[10px] font-medium text-brand-secondary">{link.desc}</p>
            </div>
            <ExternalLink size={16} className="ml-auto text-brand-secondary/40 group-hover:text-brand-primary" />
          </a>
        ))}
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[50px] border border-brand-secondary/10 shadow-sm">
        <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-brand-primary mb-10 flex items-center gap-3">
          <HelpCircle size={20} className="text-brand-secondary" />
          Perguntas Frequentes
        </h3>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-brand-secondary/5 pb-6">
              <summary className="list-none flex justify-between items-center cursor-pointer">
                <h4 className="text-sm font-bold text-brand-primary group-hover:text-brand-secondary transition-colors">
                  {faq.question}
                </h4>
                <ChevronRight size={18} className="text-brand-secondary transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-4 text-xs text-brand-primary/70 leading-relaxed pl-2 border-l-2 border-brand-secondary/20">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
