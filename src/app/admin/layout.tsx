'use client'

import Link from 'next/link'
import { Info, PlusCircle, LayoutGrid, LogOut, Gem, Eye, Share2, MessageCircle, ShoppingBag, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [whatsapp, setWhatsapp] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function loadPhone() {
      const { data } = await supabase.from('branding').select('phone').single()
      if (data?.phone) {
        setWhatsapp(data.phone.replace(/\D/g, ''))
      }
    }
    loadPhone()
  }, [])

  const shareCatalog = () => {
    const url = window.location.origin // Link do catálogo atual
    const message = encodeURIComponent(`OLÁ! ✨ ACABEI DE ATUALIZAR MEU CATÁLOGO DE SEMIJOIAS COM NOVIDADES LINDAS! 💎\n\nCONFIRA AQUI: ${url}\n\nESTOU À DISPOSIÇÃO PARA DÚVIDAS!`)
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#fffcfc] flex">
      {/* Sidebar Administrativa - Estética Luxo */}
      <aside className="w-72 bg-white border-r border-rose-50 flex flex-col pt-12 shadow-sm sticky top-0 h-screen">
        <div className="px-8 mb-16 text-center">
          <Gem className="mx-auto text-[#c99090] mb-4" size={32} />
          <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-[#4a322e]">Espaço da Empresária</h2>
          <p className="text-[8px] font-black text-[#c99090] tracking-[0.4em] uppercase mt-2 italic">Lapidado</p>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto pb-8">
          <p className="px-5 text-[7px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4 opacity-60">Gestão de Negócio</p>
          
          <Link href="/admin" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
            <Info size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Painel de Informações
          </Link>
          
          <Link href="/admin/branding" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
            <Gem size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Minha Marca
          </Link>

          <div className="pt-8">
            <p className="px-5 text-[7px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4 opacity-60">Gestão da Vitrine</p>
            
            <Link href="/admin/products/new" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
              <PlusCircle size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Cadastrar Nova Peça
            </Link>

            <Link href="/admin/categories" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
              <LayoutGrid size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Adicionar Categoria
            </Link>

            <Link href="/admin/products" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#4a322e] hover:bg-rose-50 rounded-[24px] transition-all group">
              <Pencil size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Editar / Excluir Peça
            </Link>
          </div>

          <div className="pt-8 pb-4">
            <p className="px-5 text-[7px] font-black text-[#c99090] uppercase tracking-[0.4em] mb-4 opacity-60">Visão da Cliente</p>
            
            <Link href="/" target="_blank" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-brand-primary bg-rose-50/50 hover:bg-rose-50 rounded-[24px] transition-all group border border-rose-100/50 mb-2">
              <Eye size={18} className="text-[#c99090] group-hover:scale-110 transition-transform" /> Ver Minha Vitrine
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
          <Link href="/" className="flex items-center gap-4 px-5 py-4 text-[9px] font-black tracking-[0.2em] uppercase text-[#7a5c58] hover:text-[#4a322e] transition-colors">
            <LogOut size={18} className="opacity-60" /> Sair do Painel
          </Link>
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 p-16 overflow-y-auto bg-white/40">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
