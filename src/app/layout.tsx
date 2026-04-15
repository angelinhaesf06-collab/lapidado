import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/footer';

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat' 
});

export const metadata: Metadata = {
  title: "Lapidado — Catálogo de Semijoias",
  description: "Exclusividade e brilho em cada detalhe.",
};

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  
  // 💎 NEXUS: Consulta Ultra-Resiliente para Multi-Tenancy
  const { data: { user } } = await supabase.auth.getUser()
  let branding = null

  if (user) {
    // 1. Tenta buscar a marca do usuário logado
    const { data: userBranding } = await supabase.from('branding').select('*').eq('user_id', user.id).limit(1)
    branding = userBranding?.[0]
  }
  
  if (!branding) {
    // 2. Se não achou, tenta buscar a marca original (que está sem user_id)
    const { data: orphanedBranding } = await supabase.from('branding').select('*').is('user_id', null).limit(1)
    branding = orphanedBranding?.[0]
  }

  if (!branding) {
    // 3. Fallback final: pega qualquer marca disponível
    const { data: anyBranding } = await supabase.from('branding').select('*').limit(1)
    branding = anyBranding?.[0]
  }

  // Cores dinâmicas com fallback de luxo
  const primary = branding?.primary_color || '#4a322e'
  const secondary = branding?.secondary_color || '#c99090'
  
  // 💎 NEXUS: Extrair nome do negócio da frase de impacto (coluna facebook, formato Frase|Parcelas|Banner|NomeLoja)
  const rawTagline = branding?.facebook || ''
  const businessName = rawTagline.split('|')[3] || 'LAPIDADO' 

  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <title>{`${businessName} — Catálogo de Semijoias`}</title>
      </head>
      <body 
        className={`${montserrat.variable} font-montserrat bg-[#fffcfc] text-[#4a322e] min-h-screen flex flex-col antialiased selection:bg-brand-secondary selection:text-white`}
        style={{ 
          // @ts-ignore
          '--brand-primary': primary, 
          '--brand-secondary': secondary,
          '--background': '#fffcfc'
        }}
      >
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
