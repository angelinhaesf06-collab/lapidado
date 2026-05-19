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
    <div className="bg-[#2D1B19] text-white py-2 px-4 flex justify-center items-center gap-3 fixed top-0 left-0 right-0 z-[99999] shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-b border-white/20 h-12 md:h-14">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/70">Acesso Empresária</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 bg-white text-[#4a322e] hover:bg-white/90 px-4 py-2 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95">
            <LayoutDashboard size={14} />
            <span>Voltar ao Painel</span>
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/30 px-2.5 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all text-white/90"
          >
            <LogOut size={10} />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
