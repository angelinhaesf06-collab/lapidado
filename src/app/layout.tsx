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
  const { data: branding } = await supabase.from('branding').select('*').single()

  // Cores dinâmicas com fallback de luxo
  const primary = branding?.primary_color || '#4a322e'
  const secondary = branding?.secondary_color || '#c99090'
  const businessName = branding?.instagram || 'LAPIDADO' 

  return (
    <html lang="pt-BR">
      <head>
        <title>{`${businessName} — Catálogo de Semijoias`}</title>
      </head>
      <body 
        className={`${montserrat.variable} font-montserrat bg-[#fffcfc] text-[#4a322e] min-h-screen flex flex-col antialiased`}
        style={{ 
          // @ts-ignore
          '--brand-primary': primary, 
          '--brand-secondary': secondary 
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
