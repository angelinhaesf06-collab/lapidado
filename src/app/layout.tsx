import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/footer';
import { CartProvider } from '@/lib/cart-context';

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
          <main className="flex-1">
            {children}
          </main>
        </CartProvider>
        <Footer />
      </body>
    </html>
  );
}
