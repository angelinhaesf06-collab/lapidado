'use client'

import { Montserrat } from "next/font/google";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import AdminBar from '@/components/admin-bar';
import CartIcon from '@/components/cart/cart-icon';
import { usePathname, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import { initializeBilling } from '@/lib/billing/googlePlay';

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat' 
});

export default function RootLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeSlug = searchParams.get('loja');

  useEffect(() => {
    async function loadIdentity() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // 📡 Inicializa faturamento no app nativo
        if (currentUser) {
          initializeBilling(currentUser.id);
        }

        let currentBranding = null;
        const urlParams = new URLSearchParams(window.location.search);
        const slugFromUrl = urlParams.get('loja') || storeSlug;

        if (slugFromUrl) {
          const { data } = await supabase.from('branding').select('*').eq('slug', slugFromUrl).maybeSingle();
          currentBranding = data;
        }

        if (!currentBranding && currentUser) {
          const { data } = await supabase.from('branding').select('*').eq('user_id', currentUser.id).maybeSingle();
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

  const isValidHex = (color: string | null | undefined): boolean => {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
    return hexRegex.test(color);
  };

  const brand = branding as { primary_color?: string; secondary_color?: string } | null;
  const primary = (brand?.primary_color && isValidHex(brand.primary_color)) ? brand.primary_color : '#4a322e';
  const secondary = (brand?.secondary_color && isValidHex(brand.secondary_color)) ? brand.secondary_color : '#c99090';
  
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/auth');
  const isAdminPage = pathname?.includes('/admin');
  const isLegalPage = 
    pathname?.includes('/politica') || 
    pathname?.includes('/privacidade') || 
    pathname?.includes('/termos') || 
    pathname?.includes('/excluir-conta') ||
    pathname?.includes('/cookies') ||
    pathname?.includes('/policies');
  const showFooter = !isAuthPage && !isAdminPage;

  return (
    <body 
      className={`${montserrat.variable} font-montserrat bg-[#fffcfc] text-[#4a322e] antialiased`}
      style={{ 
        // @ts-ignore
        '--brand-primary': primary, 
        // @ts-ignore
        '--brand-secondary': secondary,
        '--background': '#fffcfc'
      }}
    >
      <Toaster position="top-center" richColors />
      <CartProvider>
        <AdminBar user={user} />
        {!isAdminPage && !isAuthPage && !isLegalPage && <CartIcon />}
        <main>
          {children}
        </main>
      </CartProvider>
      {showFooter && <Footer />}
    </body>
  );
}
