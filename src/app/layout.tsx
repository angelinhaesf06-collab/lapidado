import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

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
    const { data: userBranding } = await supabase.from('branding').select('*').eq('user_id', user.id).limit(1).maybeSingle()
    branding = userBranding
  }
  
  if (!branding) {
    const { data: anyBranding } = await supabase.from('branding').select('*').limit(1).maybeSingle()
    branding = anyBranding
  }

  // 💎 NEXUS: Validação de cores
  const isValidHex = (color: string | null | undefined): boolean => {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
    return hexRegex.test(color);
  };

  const primary = (branding?.primary_color && isValidHex(branding.primary_color)) ? branding.primary_color : '#4a322e';
  const secondary = (branding?.secondary_color && isValidHex(branding.secondary_color)) ? branding.secondary_color : '#c99090';
  const businessName = branding?.store_name || 'LAPIDADO' 

  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        <title>{`${businessName} — Catálogo de Semijoias`}</title>
      </head>
      <body 
        className={`${montserrat.variable} font-montserrat bg-[#fffcfc] text-[#4a322e] min-h-screen flex flex-col antialiased`}
        style={{ 
          // @ts-ignore
          '--brand-primary': primary, 
          '--brand-secondary': secondary,
          '--background': '#fffcfc'
        }}
      >
        <CartProvider>
          {/* 💎 NEXUS: Barra de Admin VISÍVEL APENAS NA VITRINE PÚBLICA */}
          {user && !pathname?.startsWith('/admin') && pathname !== '/login' && pathname !== '/register' && (
            <div className="bg-brand-primary text-white py-2 px-4 flex justify-center items-center gap-4 sticky top-0 z-[100] shadow-lg">
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Modo Lojista Ativo 💎</p>
              <Link href="/admin" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all">
                <LayoutDashboard size={12} />
                Gerenciar Catálogo
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
