import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import AdminBar from '@/components/admin-bar';

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat' 
});

import { headers } from 'next/headers';

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

  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || "";

  // 💎 NEXUS: Regras de Visibilidade do Rodapé
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register');
  const isAdminPage = pathname.includes('/admin');
  const showFooter = !isAuthPage && !isAdminPage;

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
          <AdminBar user={user} />
          <main className="flex-1">
            {children}
          </main>
        </CartProvider>
        {showFooter && <Footer />}
      </body>
    </html>
  );
}
