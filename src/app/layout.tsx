import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CartIcon from '@/components/cart/cart-icon';
import Link from 'next/link';
import BrandingSync from '@/components/branding-sync';
import Header from '@/components/header';

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
      </body>
    </html>
  );
}
