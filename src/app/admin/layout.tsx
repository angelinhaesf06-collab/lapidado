'use client'

import Link from 'next/link'
import { Info, PlusCircle, LayoutGrid, LogOut, Gem, Eye, Share2, Pencil } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const shareCatalog = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : ''
    const message = encodeURIComponent(`OLÁ! ✨ ACABEI DE ATUALIZAR MEU CATÁLOGO DE SEMIJOIAS COM NOVIDADES LINDAS! 💎\n\nCONFIRA AQUI: ${url}\n\nESTOU À DISPOSIÇÃO PARA DÚVIDAS!`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const menuItems = [
    { href: '/admin', label: 'Painel', icon: Info },
    { href: '/admin/branding', label: 'Marca', icon: Gem },
    { href: '/admin/products/new', label: 'Cadastrar', icon: PlusCircle },
    { href: '/admin/categories', label: 'Categorias', icon: LayoutGrid },
    { href: '/admin/products', label: 'Editar', icon: Pencil },
  ]

  return (
    <div className="min-h-screen bg-[#fffcfc] flex flex-col md:flex-row">
      
      {/* MENU SUPERIOR MOBILE (Tudo visível na primeira tela) */}
      <nav className="md:hidden bg-white border-b border-rose-100 p-3 sticky top-0 z-50 shadow-sm">
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex flex-col items-center justify-center gap-1 p-2 min-w-[70px] bg-brand-secondary/10 rounded-xl border border-brand-secondary/20"
            >
              <item.icon size={16} className="text-brand-secondary" />
              <span className="text-[7px] font-black tracking-widest uppercase text-brand-primary">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="flex-1 flex items-center justify-center gap-2 p-2 bg-brand-secondary/10 rounded-xl border border-brand-secondary/20 text-[8px] font-black uppercase tracking-widest text-brand-primary">
            <Eye size={14} /> Ver Vitrine
          </Link>
          <button onClick={shareCatalog} className="flex-1 flex items-center justify-center gap-2 p-2 bg-[#25D366] text-white rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm">
            <Share2 size={14} /> Enviar WhatsApp
          </button>
        </div>
      </nav>

      {/* SIDEBAR DESKTOP (Elegância mantida no PC) */}
      <aside className="hidden md:flex w-72 bg-white border-r border-rose-50 flex-col pt-12 shadow-sm sticky top-0 h-screen">
        <div className="px-8 mb-16 text-center">
          <Gem className="mx-auto text-brand-secondary mb-4" size={32} />
          <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-brand-primary">Espaço da Empresária</h2>
          <p className="text-[8px] font-black text-brand-secondary tracking-[0.4em] uppercase mt-2 italic">Lapidado</p>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto pb-8">
          <p className="px-5 text-[7px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-4 opacity-60">Gestão de Negócio</p>
          
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-brand-primary hover:bg-brand-secondary/10 rounded-[24px] transition-all group"
            >
              <item.icon size={18} className="text-brand-secondary group-hover:scale-110 transition-transform" /> {item.label}
            </Link>
          ))}

          <div className="pt-8 pb-4">
            <p className="px-5 text-[7px] font-black text-brand-secondary uppercase tracking-[0.4em] mb-4 opacity-60">Visão da Cliente</p>
            
            <Link href="/" target="_blank" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-brand-primary bg-brand-secondary/5 hover:bg-brand-secondary/10 rounded-[24px] transition-all group border border-brand-secondary/10 mb-2">
              <Eye size={18} className="text-brand-secondary group-hover:scale-110 transition-transform" /> Ver Minha Vitrine
            </Link>

            <button 
              onClick={shareCatalog}
              className="w-full flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-white bg-[#25D366] hover:brightness-105 rounded-[24px] transition-all group shadow-lg shadow-green-100"
            >
              <Share2 size={18} className="group-hover:scale-110 transition-transform" /> Enviar Para Cliente
            </button>
          </div>
        </nav>

        <div className="p-8 border-t border-rose-50 bg-rose-50/20">
          <Link href="/" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-brand-primary/60 hover:text-brand-primary transition-colors">
            <LogOut size={18} className="opacity-60" /> Sair do Painel
          </Link>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 p-6 md:p-16 overflow-y-auto bg-white/40">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
