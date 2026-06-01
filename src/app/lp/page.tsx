'use client'

import { 
  Gem, 
  Zap, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  ShieldCheck, 
  Camera, 
  Play,
  ShoppingBag,
  Sparkles,
  Award,
  Users
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-brand-primary selection:bg-brand-secondary/30 selection:text-brand-primary">
      
      {/* 💎 NAVEGAÇÃO */}
      <nav className="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-md border-b border-rose-100/50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg">
            <Gem size={20} />
          </div>
          <span className="font-black uppercase tracking-[0.3em] text-sm">Lapidado</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-secondary transition-colors">Funcionalidades</Link>
          <Link href="#depoimentos" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-secondary transition-colors">Depoimentos</Link>
          <Link 
            href="/login" 
            className="px-6 py-2 rounded-full border-2 border-brand-primary text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
          >
            Entrar
          </Link>
        </div>
        <Link href="/login" className="md:hidden text-[10px] font-black uppercase tracking-widest text-brand-primary">Entrar</Link>
      </nav>

      {/* 🚀 HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-rose-50/50 to-transparent">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-secondary/10 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3" />
        
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-100 text-brand-secondary shadow-sm">
            <Sparkles size={14} className="fill-brand-secondary" />
            <span className="text-[10px] font-black uppercase tracking-widest">A Revolução Digital das Semijoias</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-black leading-[1.1] tracking-tight text-brand-primary max-w-4xl mx-auto">
            Chega de perder horas fazendo <span className="text-brand-secondary">descrições</span> e ter um catálogo sem graça.
          </h1>

          <p className="text-lg md:text-2xl text-[#7a5c58] font-medium max-w-3xl mx-auto leading-relaxed">
            Agora você faz um catálogo em minutos com <span className="font-bold underline decoration-brand-secondary">cara de site profissional</span>.
          </p>

          <div className="flex flex-col items-center gap-6 pt-4">
            <Link 
              href="/register" 
              className="group w-full sm:w-auto px-12 py-6 rounded-3xl bg-brand-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/30 hover:scale-105 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              Criar Meu Catálogo de Luxo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="flex flex-wrap justify-center gap-6">
               <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                  <ShieldCheck size={16} /> Teste Grátis por 7 dias
               </div>
               <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest">
                  <CheckCircle2 size={16} /> Sem cartão de crédito
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📺 VIDEO SECTION 1: IA EM AÇÃO */}
      <section className="py-24 px-6 bg-white" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="w-16 h-1 bg-brand-secondary rounded-full" />
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                Sua IA Pessoal de <span className="text-brand-secondary">Joalheria</span>
              </h2>
              <p className="text-xl text-[#7a5c58] leading-relaxed">
                Transforme uma foto bruta em uma <span className="font-bold">descrição luxuosa e persuasiva</span> em segundos. Nossa IA entende o valor de cada detalhe e cria o desejo de compra imediato para suas clientes.
              </p>
              <ul className="space-y-4">
                {[
                  "Foco em gatilhos mentais de luxo",
                  "Descrições poéticas e profissionais",
                  "Economia de 10h+ de trabalho manual"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-sm">
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-brand-secondary">
                      <CheckCircle2 size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative order-1 lg:order-2">
              <div className="absolute -inset-4 bg-brand-secondary/5 rounded-[40px] blur-2xl -z-10" />
              <div className="bg-brand-primary rounded-[32px] overflow-hidden shadow-3xl aspect-[4/3] relative flex items-center justify-center group border-4 border-white">
                 <video 
                   src="/videos/ia-demonstracao.mp4" 
                   autoPlay 
                   muted 
                   loop 
                   playsInline
                   className="absolute inset-0 w-full h-full object-cover opacity-80"
                 />
                 <div className="relative z-10 flex flex-col items-center gap-4 pointer-events-none">
                    <span className="bg-brand-secondary text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse">A Mágica em Tempo Real</span>
                 </div>
                 {/* Overlay de carregamento simulado */}
                 <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex items-center gap-4 z-20">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-brand-primary">
                       <Zap size={20} className="animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-1">
                       <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-secondary w-2/3" />
                       </div>
                       <p className="text-[8px] font-black uppercase tracking-widest text-white/80">IA Lapidado: Gerando descrição de luxo...</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📱 VIDEO SECTION 2: VITRINE PROFISSIONAL */}
      <section className="py-24 px-6 bg-brand-beige/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-brand-primary/5 rounded-full blur-3xl -z-10" />
              <div className="mx-auto w-[280px] h-[580px] bg-brand-primary rounded-[45px] border-[8px] border-brand-primary shadow-2xl overflow-hidden relative group">
                 <div className="absolute top-0 w-full h-8 flex justify-center items-center z-20">
                    <div className="w-20 h-4 bg-brand-primary rounded-b-xl" />
                 </div>
                 <div className="absolute inset-0 bg-white">
                    <video 
                      src="/videos/vitrine-mobile.mp4" 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="w-full h-full object-cover"
                    />
                 </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white p-6 rounded-3xl shadow-2xl border border-rose-100 max-w-[200px] animate-bounce-slow">
                 <ShoppingBag className="text-brand-secondary mb-3" size={24} />
                 <p className="text-xs font-black uppercase tracking-widest leading-tight">Catalogo Otimizado para Mobile</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="w-16 h-1 bg-brand-secondary rounded-full" />
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                Vitrine <span className="text-brand-secondary">Profissional</span> no Celular
              </h2>
              <p className="text-xl text-[#7a5c58] leading-relaxed">
                Esqueça os catálogos em PDF pesados. O Lapidado cria uma experiência de compra <span className="font-bold underline decoration-brand-secondary">fluida e luxuosa</span> direto no navegador ou no app da sua cliente.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-brand-secondary font-black text-2xl">100%</div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Responsivo</p>
                </div>
                <div className="space-y-2">
                  <div className="text-brand-secondary font-black text-2xl">0.5s</div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Carregamento</p>
                </div>
              </div>
              <div className="pt-4">
                 <div className="flex items-center gap-4">
                    <div className="flex-1 h-[2px] bg-rose-100" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Disponível em</span>
                    <div className="flex-1 h-[2px] bg-rose-100" />
                 </div>
                 <div className="flex gap-4 mt-6">
                    <div className="flex-1 bg-brand-primary text-white p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-black transition-colors">
                       <Smartphone size={20} />
                       <div className="text-left">
                          <p className="text-[7px] uppercase font-bold opacity-60 leading-none">Baixar na</p>
                          <p className="text-[10px] font-black uppercase leading-none mt-1">Play Store</p>
                       </div>
                    </div>
                    <div className="flex-1 bg-brand-primary text-white p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-black transition-colors">
                       <Smartphone size={20} />
                       <div className="text-left">
                          <p className="text-[7px] uppercase font-bold opacity-60 leading-none">Baixar na</p>
                          <p className="text-[10px] font-black uppercase leading-none mt-1">App Store</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 TESTEMUNHOS & CONFIANÇA */}
      <section className="py-24 px-6 bg-white" id="depoimentos">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.4em]">Confiança & Brilho</h2>
            <p className="text-3xl md:text-5xl font-black text-brand-primary">O que dizem as especialistas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Cláudia M.",
                role: "Joalheira Artesanal",
                text: "O Lapidado mudou minha rotina. Antes eu levava o dia todo para descrever uma coleção, agora faço em 10 minutos."
              },
              {
                name: "Fernanda S.",
                role: "CEO Brilho Raro",
                text: "Minhas clientes comentam como o catálogo ficou profissional. Minhas vendas aumentaram 30% desde que comecei a usar."
              },
              {
                name: "Juliana L.",
                role: "Revendedora Premium",
                text: "A IA é simplesmente mágica. Os textos que ela gera são muito mais bonitos do que os que eu tentava escrever."
              }
            ].map((dep, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-rose-50/30 border border-rose-100 space-y-4">
                <div className="flex gap-1 text-brand-secondary">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                </div>
                <p className="italic text-[#7a5c58] leading-relaxed">"{dep.text}"</p>
                <div className="pt-4">
                  <p className="font-black text-xs uppercase tracking-widest">{dep.name}</p>
                  <p className="text-[10px] uppercase font-bold text-brand-secondary/60 tracking-widest mt-1">{dep.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 py-12 border-t border-b border-rose-100 flex flex-wrap justify-center gap-12 md:gap-24 grayscale opacity-40">
             <div className="flex items-center gap-2"><Award size={24} /> <span className="font-black uppercase tracking-widest text-sm">Prêmio E-commerce 2025</span></div>
             <div className="flex items-center gap-2"><Users size={24} /> <span className="font-black uppercase tracking-widest text-sm">+2.000 Usuárias Ativas</span></div>
             <div className="flex items-center gap-2"><CheckCircle2 size={24} /> <span className="font-black uppercase tracking-widest text-sm">Empresa Verificada</span></div>
          </div>
        </div>
      </section>

      {/* 🚀 FINAL CTA */}
      <section className="py-32 bg-brand-primary text-white px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid grid-cols-8 gap-8 rotate-12 -translate-y-1/2">
            {Array.from({ length: 32 }).map((_, i) => (
               <Gem key={i} size={80} />
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <div className="w-20 h-20 bg-brand-secondary rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-3">
             <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
            Sua marca merece o <span className="text-brand-secondary">profissionalismo</span> de uma grife.
          </h2>
          <p className="text-white/70 text-xl font-medium max-w-2xl mx-auto">
            Não deixe para amanhã a organização que pode dobrar seus resultados hoje.
          </p>
          <div className="pt-6 flex flex-col items-center gap-8">
            <Link 
              href="/register" 
              className="px-16 py-8 rounded-[32px] bg-white text-brand-primary font-black uppercase tracking-[0.2em] shadow-3xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-4 text-sm"
            >
              Criar Meu Catálogo Grátis <ArrowRight size={20} />
            </Link>
            
            <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
               <div className="flex items-center gap-2"><ShieldCheck size={14} /> Garantia de 7 Dias</div>
               <div className="flex items-center gap-2"><Clock size={14} /> Setup em 2 Minutos</div>
               <div className="flex items-center gap-2"><CheckCircle2 size={14} /> Cancele a Qualquer Momento</div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 RODAPÉ */}
      <footer className="py-16 bg-[#FDFCFB] border-t border-rose-100 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                  <Gem size={16} />
                </div>
                <span className="font-black uppercase tracking-[0.3em] text-xs text-brand-primary">Lapidado</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary/40 leading-relaxed max-w-[240px]">
                A solução definitiva para o profissionalismo da empresária de semijoias.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Produto</h4>
                <ul className="space-y-2">
                   <li><Link href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors">Funcionalidades</Link></li>
                   <li><Link href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors">Preços</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Legal</h4>
                <ul className="space-y-2">
                   <li><Link href="/termos" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors">Termos</Link></li>
                   <li><Link href="/privacidade" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors">Privacidade</Link></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Social</h4>
                <ul className="space-y-2">
                   <li><Link href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors">Instagram</Link></li>
                   <li><Link href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-brand-primary transition-colors">WhatsApp</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-rose-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-primary/30">© 2026 Lapidado. Todos os direitos reservados.</p>
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full border border-rose-100 flex items-center justify-center text-brand-primary/40 hover:text-brand-primary transition-colors cursor-pointer">
                  <Camera size={14} />
               </div>
               <div className="w-8 h-8 rounded-full border border-rose-100 flex items-center justify-center text-brand-primary/40 hover:text-brand-primary transition-colors cursor-pointer">
                  <Smartphone size={14} />
               </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Estilos Adicionais */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(0); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>

    </div>
  )
}
