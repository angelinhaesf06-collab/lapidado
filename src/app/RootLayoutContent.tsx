'use client'

import { Montserrat } from "next/font/google";
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import AdminBar from '@/components/admin-bar';
import CartIcon from '@/components/cart/cart-icon';
import Onboarding from '@/components/Onboarding';
import { usePathname, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import { initializeBilling } from '@/lib/billing/googlePlay';
import { resolveStoreSlug } from '@/lib/utils';

const montserrat = Montserrat({
  subsets: ["latin"],
  // ⚡ Apenas os pesos realmente usados no app (antes carregava os 9 → mais leve no carregamento)
  weight: ['300', '400', '500', '600', '700', '900'],
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
  const storeSlug = resolveStoreSlug(searchParams, pathname);

  useEffect(() => {
    async function loadIdentity() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.id !== user?.id) {
          console.log('👤 [Identity] Usuário detectado:', currentUser?.email);
          setUser(currentUser);

          if (currentUser) {
            // Inicializa apenas uma vez por login de usuário
            initializeBilling(currentUser.id, supabase);
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const slugFromUrl = urlParams.get('loja') || storeSlug;

        if (slugFromUrl) {
          const { data: bData } = await supabase.from('branding').select('*').eq('slug', slugFromUrl).maybeSingle();
          if (bData) setBranding(bData);
        } else if (currentUser && !branding) {
          const { data: bData } = await supabase.from('branding').select('*').eq('user_id', currentUser.id).maybeSingle();
          if (bData) setBranding(bData);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar identidade:', error);
      }
    }
    loadIdentity();
  }, [supabase]); // 💎 NEXUS: Removido pathname para evitar chamadas constantes ao Google Play

  const isValidHex = (color: string | null | undefined): boolean => {
    if (!color) return false;
    const hexRegex = /^#([A-Fa-f0-9]{3,4}){1,2}$/;
    return hexRegex.test(color);
  };

  const brand = branding as { primary_color?: string; secondary_color?: string } | null;
  const primary = (brand?.primary_color && isValidHex(brand.primary_color)) ? brand.primary_color : '#4a322e';
  const secondary = (brand?.secondary_color && isValidHex(brand.secondary_color)) ? brand.secondary_color : '#c99090';
  
  const isAuthPage = !!pathname && (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/auth'));
  const isAdminPage = !!pathname && pathname.includes('/admin');
  const isLpPage = pathname === '/lp';
  const isLegalPage = !!pathname && (
    pathname.includes('/politica') || 
    pathname.includes('/privacidade') || 
    pathname.includes('/termos') || 
    pathname.includes('/excluir-conta') ||
    pathname.includes('/cookies') ||
    pathname.includes('/policies')
  );
  const showFooter = !isAuthPage && !isAdminPage;

  // 🚫 A barra de administração NUNCA deve aparecer na vitrine/visão do cliente (catalogo=true ou ?loja=)
  const isCustomerView = !!storeSlug || searchParams.get('catalogo') === 'true';
  const showAdminBar = !!user && !isCustomerView && (pathname === '/' || pathname?.startsWith('/product') || pathname === '/cart');

  // 💎 NEXUS: Bloqueio do Prompt de Instalação (PWA) na Vitrine do Cliente
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Detecta se é a visão do cliente (vitrine pública)
      const isCustomerView = storeSlug || searchParams.get('catalogo') === 'true' || pathname?.startsWith('/product');
      const isAdmin = pathname?.startsWith('/admin');

      if (isCustomerView && !isAdmin) {
        e.preventDefault();
        console.log('🚫 [PWA] Prompt de instalação interceptado para proteger a marca do lojista.');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [storeSlug, searchParams, pathname]);

  return (
    <body 
      className={`${montserrat.variable} font-montserrat bg-[#F5F0E6] text-[#5D4037] antialiased min-h-[100svh] ${showAdminBar ? 'pt-[env(safe-area-inset-top,44px)] md:pt-16' : ''}`}
      style={{ 
        '--brand-primary': primary, 
        '--brand-secondary': secondary,
        '--background': '#F5F0E6'
      } as React.CSSProperties}
    >
      <Toaster position="top-center" richColors />
      <Onboarding />
      <CartProvider>
        {showAdminBar && <AdminBar user={user} />}
        {!isAdminPage && !isAuthPage && !isLegalPage && !isLpPage && <CartIcon />}
        <main>
          {children}
        </main>
      </CartProvider>
      {showFooter && <Footer />}
    </body>
  );
}
