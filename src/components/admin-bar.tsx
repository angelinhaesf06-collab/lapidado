'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminBar({ user }: { user: unknown }) {
  const pathname = usePathname()
  const supabase = createClient()

  // 💎 NEXUS: Lógica de Visibilidade Ultra-Segura no Cliente
  const isPublicPage = pathname === '/' || pathname?.startsWith('/product') || pathname === '/cart'
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user || !isPublicPage) return null

  return (
    <div className="bg-brand-primary text-white py-2 px-4 flex justify-center items-center gap-4 sticky top-0 z-[100] shadow-lg animate-in slide-in-from-top duration-500">
      <p className="text-[8px] font-black uppercase tracking-[0.3em]">Modo Lojista Ativo 💎</p>
      
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all">
          <LayoutDashboard size={12} />
          Painel Admin
        </Link>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all text-white/80"
        >
          <LogOut size={12} />
          Sair
        </button>
      </div>
    </div>
  )
}
