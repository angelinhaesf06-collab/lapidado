import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { headers } from 'next/headers';

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

  // 💎 NEXUS: Validação de cores para garantir HEX válido
  const isValidHex = (color: string | null | undefined): boolean => {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
    return hexRegex.test(color);
  };

  // Cores dinâmicas com fallback de luxo e validação rigorosa
  const primary = (branding?.primary_color && isValidHex(branding.primary_color)) 
    ? branding.primary_color 
    : '#4a322e';
  const secondary = (branding?.secondary_color && isValidHex(branding.secondary_color))
    ? branding.secondary_color
    : '#c99090';
  
  // 💎 NEXUS: Extrair nome do negócio (Preferência pela nova coluna store_name)
  const businessName = branding?.store_name || 'LAPIDADO' 
  const slogan = `${businessName}: Mais que acessórios, a sua assinatura de estilo.`

  // 💎 NEXUS: Lógica de Visibilidade da Tarja (Apenas na Vitrine e Catálogo)
  const headersList = await headers();
  const fullPath = headersList.get('x-invoke-path') || '';
  const isPublicPage = fullPath === '/' || fullPath.startsWith('/product') || fullPath === '/cart';

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
        <CartProvider>
          {user && isPublicPage && (
            <div className="bg-brand-primary text-white py-2 px-4 flex justify-center items-center gap-4 sticky top-0 z-[100] shadow-lg animate-in slide-in-from-top duration-500">
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Logada como Admin 💎</p>
              <Link href="/admin" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all">
                <LayoutDashboard size={12} />
                Voltar ao Painel
              </Link>
            </div>
          )}
          <main className="flex-1">
            {children}
          </main>
        </CartProvider>
        <Footer />
      </body>
    </html>
  );
}
