import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CartIcon from '@/components/cart/cart-icon';
import Link from 'next/link';
import BrandingSync from '@/components/branding-sync';

const inter = Inter({ subsets: ["latin"], weight: ['300', '400', '600'] });

export const metadata: Metadata = {
  title: "Lapidado — Catálogo de Semijoias",
  description: "Exclusividade e brilho em cada detalhe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-[#fffcfc] text-[#4a322e] min-h-screen flex flex-col antialiased`}>
        <BrandingSync />
        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-[#4a322e] text-rose-50 py-16 mt-24">
          <div className="max-w-7xl mx-auto px-4 text-center flex flex-col items-center gap-6">
            <h2 className="text-xl font-normal tracking-[0.3em] uppercase opacity-80">Lapidado</h2>
            <p className="text-[9px] font-light opacity-50 tracking-[0.5em] uppercase">Exclusividade em Semijoias</p>
            <div className="h-px w-16 bg-rose-100/20" />
            <p className="text-[9px] font-light opacity-40 tracking-[0.2em] uppercase">© 2026 Todos os direitos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
