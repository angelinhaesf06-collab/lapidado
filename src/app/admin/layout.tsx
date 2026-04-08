import Link from 'next/link'
import { Info, PlusCircle, LayoutGrid, LogOut, Gem } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#fffcfc] flex">
      {/* Sidebar Administrativa - Estética Luxo */}
      <aside className="w-72 bg-white border-r border-rose-50 flex flex-col pt-12 shadow-sm">
        <div className="px-8 mb-16 text-center">
          <Gem className="mx-auto text-[#c99090] mb-4" size={32} />
          <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-[#4a322e]">Espaço da Empresária</h2>
          <p className="text-[8px] font-black text-[#c99090] tracking-[0.4em] uppercase mt-2">Lapidado</p>
        </div>

        <nav className="flex-1 px-6 space-y-3">
          <Link href="/admin" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
            <Info size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Painel de Informações
          </Link>
          
          <Link href="/admin/branding" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
            <Gem size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Minha Marca
          </Link>
          
          <Link href="/admin/products/new" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
            <PlusCircle size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Nova Peça
          </Link>
          
          <Link href="/admin/products" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
            <LayoutGrid size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Meu Catálogo
          </Link>
        </nav>

        <div className="p-8 border-t border-rose-50">
          <Link href="/" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#7a5c58] hover:text-[#4a322e] transition-colors">
            <LogOut size={18} className="opacity-60" /> Sair do Painel
          </Link>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 p-16 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
