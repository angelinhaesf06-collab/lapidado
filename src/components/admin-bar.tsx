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
    <div className="bg-[#4a322e] text-white py-2 px-4 flex justify-center items-center gap-4 fixed top-0 left-0 right-0 z-[9999] shadow-xl animate-in slide-in-from-top duration-500 border-b border-white/10">
      <div className="flex justify-center items-center gap-4 md:gap-6 w-full max-w-7xl mx-auto">
        <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-80 whitespace-nowrap">Admin 💎</p>
        
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all shadow-sm">
            <LayoutDashboard size={12} />
            <span className="hidden xs:inline">Painel Admin</span>
            <span className="xs:hidden">Painel</span>
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/40 px-3 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all text-white shadow-sm"
          >
            <LogOut size={12} />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
