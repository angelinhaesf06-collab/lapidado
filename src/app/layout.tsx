'use client'

import { Montserrat } from "next/font/google";
import "./globals.css";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';
import AdminBar from '@/components/admin-bar';
import { usePathname } from 'next/navigation';

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat' 
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<unknown>(null);
  const [branding, setBranding] = useState<unknown>(null);
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    async function loadIdentity() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      let currentBranding = null;
      if (currentUser) {
        const { data } = await supabase.from('branding').select('*').eq('user_id', currentUser.id).limit(1).maybeSingle();
        currentBranding = data;
      }
      
      if (!currentBranding) {
        const { data } = await supabase.from('branding').select('*').limit(1).maybeSingle();
        currentBranding = data;
      }

      setBranding(currentBranding);
    }
    loadIdentity();
  }, [supabase]);

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
    <html lang="pt-BR" className="scroll-smooth">
      <body 
        className={`${montserrat.variable} font-montserrat bg-[#fffcfc] text-[#4a322e] min-h-screen flex flex-col antialiased`}
        style={{ 
          // @ts-expect-error - Custom properties are not yet in CSSProperties
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
