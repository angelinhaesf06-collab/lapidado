'use client'

import { Montserrat } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import AdminBar from '@/components/admin-bar';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat' 
});

function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const supabase = createClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get('loja');

  useEffect(() => {
    async function loadIdentity() {
      try {
        // 1. Verificar usuário logado
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        let currentBranding = null;

        // 2. Prioridade 1: Buscar pela Loja (Slug) na URL
        const urlParams = new URLSearchParams(window.location.search);
        const slugFromUrl = urlParams.get('loja') || storeSlug;

        if (slugFromUrl) {
          console.log('💎 NEXUS: BUSCANDO POR SLUG:', slugFromUrl);
          const { data } = await supabase.from('branding').select('*').eq('slug', slugFromUrl).maybeSingle();
          currentBranding = data;
        }

        // 3. Prioridade 2: Buscar pelo Usuário Logado
        if (!currentBranding && currentUser) {
          console.log('💎 NEXUS: BUSCANDO POR USER_ID:', currentUser.id);
          const { data } = await supabase.from('branding').select('*').eq('user_id', currentUser.id).maybeSingle();
          currentBranding = data;
        }
        
        // 4. Fallback: Buscar a primeira configuração existente (Geralmente a principal)
        if (!currentBranding) {
          console.log('💎 NEXUS: FALLBACK BRANDING');
          const { data } = await supabase.from('branding').select('*').limit(1).maybeSingle();
          currentBranding = data;
        }

        if (currentBranding) {
          setBranding(currentBranding);
        }
      } catch (error) {
        console.error('Erro ao carregar branding:', error);
      }
    }
    loadIdentity();
  }, [supabase, storeSlug, pathname]);

  // 💎 NEXUS: Validação de cores
  const isValidHex = (color: string | null | undefined): boolean => {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
    return hexRegex.test(color);
  };

  const brand = branding as { primary_color?: string; secondary_color?: string } | null;
  const primary = (brand?.primary_color && isValidHex(brand.primary_color)) ? brand.primary_color : '#4a322e';
  const secondary = (brand?.secondary_color && isValidHex(brand.secondary_color)) ? brand.secondary_color : '#c99090';
  
  const isAuthPage = pathname.includes('/login') || pathname.includes('/register');
  const isAdminPage = pathname.includes('/admin');
  const showFooter = !isAuthPage && !isAdminPage;

  return (
    <body 
      className={`${montserrat.variable} font-montserrat bg-[#fffcfc] text-[#4a322e] min-h-screen flex flex-col antialiased`}
      style={{ 
        // @ts-ignore
        '--brand-primary': primary, 
        // @ts-ignore
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
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <Suspense fallback={<body></body>}>
        <RootLayoutContent>{children}</RootLayoutContent>
      </Suspense>
    </html>
  );
}
