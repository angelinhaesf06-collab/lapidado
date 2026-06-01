'use client'

import { Gem, Zap, Clock, Smartphone, CheckCircle2, ArrowRight, Star, ShieldCheck, Instagram, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#4a322e] selection:bg-rose-200 selection:text-rose-900">
      
      {/* 💎 NAVEGAÇÃO MINIMALISTA */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-rose-100/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
            <Gem size={18} />
          </div>
          <span className="font-black uppercase tracking-[0.3em] text-xs">Lapidado</span>
        </div>
        <Link 
          href="/login" 
          className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:opacity-60 transition-opacity"
        >
          Entrar
        </Link>
      </nav>

      {/* 🚀 HERO SECTION: O IMPACTO IMEDIATO */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Decorativo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-brand-secondary/5 rounded-full blur-3xl -z-10 -translate-x-1/2" />

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-brand-primary animate-bounce">
            <Star size={14} className="fill-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest">A escolha das grandes joalheiras</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight text-brand-primary">
            Chega de perder horas fazendo <span className="text-brand-secondary">descrições</span> nas suas peças.
          </h1>

          <p className="text-lg md:text-xl text-[#7a5c58] font-medium max-w-2xl mx-auto leading-relaxed">
            Tenha um catálogo profissional em minutos com a nossa **IA Mágica**. Transforme fotos simples em desejo de compra imediato.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-10 py-5 rounded-3xl bg-brand-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Começar Agora Grátis <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-bold text-brand-secondary/60 uppercase tracking-widest">
              <ShieldCheck size={16} /> 7 dias de teste gratuito
            </div>
          </div>
        </div>

        {/* MOCKUP DO APP (REPRESENTAÇÃO VISUAL) */}
        <div className="mt-20 max-w-5xl mx-auto relative group">
           <div className="absolute inset-0 bg-gradient-to-t from-[#FDFCFB] via-transparent to-transparent z-10" />
           <div className="bg-white p-2 rounded-[40px] shadow-2xl border border-rose-100 overflow-hidden transform group-hover:-rotate-1 transition-transform duration-700">
             <div className="aspect-video relative bg-rose-50/50 flex items-center justify-center overflow-hidden">
               {/* Aqui simulamos a vitrine profissional */}
               <div className="grid grid-cols-4 gap-4 p-8 w-full h-full opacity-40 blur-[1px]">
                 {[1,2,3,4,5,6,7,8].map(i => (
                   <div key={i} className="aspect-[3/4] bg-white rounded-2xl shadow-sm" />
                 ))}
               </div>
               <div className="absolute z-20 flex flex-col items-center gap-4 text-center px-6">
                 <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-brand-primary animate-pulse">
                   <Zap size={40} />
                 </div>
                 <h3 className="text-2xl font-black uppercase tracking-widest text-brand-primary">IA Gerando Descrição...</h3>
                 <p className="bg-brand-primary text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Pronto em 2 segundos ✨</p>
               </div>
             </div>
           </div>
        </div>
      </section>

      {/* 💎 DIFERENCIAIS: O "PORQUE" COMPRAR */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em]">Por que o Lapidado?</h2>
            <p className="text-3xl font-bold text-brand-primary">Sua joia merece um palco profissional.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6 group">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                <Zap size={28} />
              </div>
              <h4 className="text-xl font-bold">Descrição Mágica com IA</h4>
              <p className="text-[#7a5c58] leading-relaxed">
                Tire uma foto e deixe nossa IA escrever textos poéticos e persuasivos. Venda mais sem precisar ser escritora.
              </p>
            </div>

            <div className="space-y-6 group">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                <Smartphone size={28} />
              </div>
              <h4 className="text-xl font-bold">Catalogo com Cara de Site</h4>
              <p className="text-[#7a5c58] leading-relaxed">
                Esqueça PDFs pesados ou listas de fotos. Suas clientes navegam em uma vitrine luxuosa que funciona direto no celular.
              </p>
            </div>

            <div className="space-y-6 group">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                <MessageCircle size={28} />
              </div>
              <h4 className="text-xl font-bold">Venda Direta pelo Whats</h4>
              <p className="text-[#7a5c58] leading-relaxed">
                A cliente escolhe as peças e te chama no WhatsApp com o pedido pronto. Menos conversa, mais fechamentos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 CALL TO ACTION FINAL */}
      <section className="py-24 bg-brand-primary text-white px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-6 gap-4 rotate-12">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
               <Gem key={i} size={100} />
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Pronta para dar o brilho que sua marca merece?
          </h2>
          <p className="text-white/70 text-lg font-medium">
            Junte-se a centenas de empresárias que já economizam 10h+ por semana com o Lapidado.
          </p>
          <div className="pt-4 flex flex-col items-center gap-6">
            <Link 
              href="/register" 
              className="px-12 py-6 rounded-3xl bg-white text-brand-primary font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3"
            >
              Criar Meu Catálogo Grátis <ArrowRight size={18} />
            </Link>
            <div className="flex items-center gap-6 text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
               <div className="flex items-center gap-2"><CheckCircle2 size={12} /> Sem Cartão de Crédito</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={12} /> Instalação Imediata</div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 RODAPÉ */}
      <footer className="py-12 bg-[#FDFCFB] border-t border-rose-100 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-primary flex items-center justify-center text-white">
              <Gem size={14} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Lapidado 2026</span>
          </div>
          
          <div className="flex gap-8">
            <Link href="/termos" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary">Termos</Link>
            <Link href="/privacidade" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary">Privacidade</Link>
          </div>

          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-brand-primary">
              <Instagram size={16} />
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-brand-primary">
              <Smartphone size={16} />
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
