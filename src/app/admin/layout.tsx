'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, ShoppingCart, Package, Gem, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Vendas', href: '/admin/sales', icon: ShoppingCart },
    { name: 'Produtos', href: '/admin/products', icon: Package },
    { name: 'Nova Peça', href: '/admin/products/new', icon: PlusCircle },
  ]

  return (
    <div className="flex min-h-screen bg-[#fffcfc]">
      
      {/* 💎 SIDEBAR LAPIDADO (ESQUERDA) */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-brand-secondary/10 p-8 sticky top-0 h-screen z-50 shadow-[20px_0_40px_rgba(74,50,46,0.02)]">
        
        {/* LOGO NO TOPO DA SIDEBAR */}
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
            <Gem size={22} />
          </div>
          <div>
            <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-primary leading-none">Lapidado</h1>
            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-brand-secondary mt-1">Gestão Empresarial</p>
          </div>
        </div>
        
        {/* NAVEGAÇÃO */}
        <nav className="space-y-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${
                  isActive 
                  ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/20 translate-x-2' 
                  : 'text-brand-secondary/60 hover:bg-brand-secondary/5 hover:text-brand-primary'
                }`}
              >
                <item.icon size={20} className={`${isActive ? 'text-white' : 'text-brand-secondary/40 group-hover:text-brand-primary'}`} /> 
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* RODAPÉ DA SIDEBAR */}
        <div className="pt-8 border-t border-brand-secondary/10">
           <Link href="/" className="flex items-center gap-4 px-6 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-brand-secondary/40 hover:text-rose-500 transition-all">
              <LogOut size={20} /> Sair do Painel
           </Link>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full overflow-x-hidden">
        {/* BARRA SUPERIOR MOBILE (Apenas telas pequenas) */}
        <div className="md:hidden bg-white border-b border-brand-secondary/10 p-4 flex justify-between items-center sticky top-0 z-50">
           <div className="flex items-center gap-3">
             <Gem size={20} className="text-brand-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Lapidado</span>
           </div>
           {/* Menu Mobile pode ser adicionado aqui depois */}
        </div>

        <div className="px-4 py-8 md:px-12 md:py-16">
          {children}
        </div>
      </main>
    </div>
  )
}
