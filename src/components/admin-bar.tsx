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
    <div className="bg-[#4a322e]/95 backdrop-blur-md text-white py-1 px-4 flex justify-center items-center gap-3 fixed top-0 left-0 right-0 z-[9999] shadow-lg animate-in slide-in-from-top duration-500 border-b border-white/5 h-8 md:h-10">
      <div className="flex justify-center items-center gap-3 md:gap-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all">
            <LayoutDashboard size={10} />
            <span>Painel</span>
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
