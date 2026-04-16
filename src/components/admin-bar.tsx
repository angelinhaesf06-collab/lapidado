'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'

export default function AdminBar({ user }: { user: any }) {
  const pathname = usePathname()

  // 💎 NEXUS: Lógica de Visibilidade Ultra-Segura no Cliente
  const isPublicPage = pathname === '/' || pathname?.startsWith('/product') || pathname === '/cart'
  
  if (!user || !isPublicPage) return null

  return (
    <div className="bg-brand-primary text-white py-2 px-4 flex justify-center items-center gap-4 sticky top-0 z-[100] shadow-lg animate-in slide-in-from-top duration-500">
      <p className="text-[8px] font-black uppercase tracking-[0.3em]">Modo Lojista Ativo 💎</p>
      <Link href="/admin" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all">
        <LayoutDashboard size={12} />
        Gerenciar Catálogo
      </Link>
    </div>
  )
}
