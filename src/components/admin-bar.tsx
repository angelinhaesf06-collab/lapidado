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

  return null
}
