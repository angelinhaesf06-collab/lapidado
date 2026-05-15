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
    <div className="bg-[#4a322e]/90 backdrop-blur-md text-white py-1.5 px-4 flex justify-center items-center gap-4 sticky top-0 z-[100] shadow-sm animate-in slide-in-from-top duration-500 border-b border-white/10">
      <div className="flex justify-center items-center gap-6">
        <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-80">Acesso Administrativo 💎</p>
        
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all">
            <LayoutDashboard size={10} />
            Painel Admin
          </Link>
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all text-rose-200"
          >
            <LogOut size={10} />
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
