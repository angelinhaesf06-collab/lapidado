import Link from 'next/link'
import { Gem, ShoppingBag, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-rose-50 sticky top-0 z-50 h-[158px] flex flex-col items-center justify-center shadow-sm">
      <div className="max-w-7xl w-full px-6 flex items-center justify-between">
        {/* Lado Esquerdo - Menu Oculto/Espaçador */}
        <div className="flex-1 flex gap-6">
          <Link href="/" className="text-[10px] font-light tracking-[0.3em] uppercase text-[#7a5c58] hover:text-[#c99090] transition-colors">
            Início
          </Link>
          <Link href="/catalog" className="text-[10px] font-light tracking-[0.3em] uppercase text-[#7a5c58] hover:text-[#c99090] transition-colors">
            Coleções
          </Link>
        </div>

        {/* Centro - Logo Luxuoso */}
        <div className="flex flex-col items-center text-center px-8 group">
          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-[#c99090] mb-3 group-hover:scale-110 transition-transform duration-700">
            <Gem size={20} />
          </div>
          <h1 className="text-2xl font-normal tracking-[0.4em] uppercase text-[#4a322e]">Lapidado</h1>
          <p className="text-[8px] font-light text-[#c99090] tracking-[0.6em] uppercase mt-2 opacity-80">Catálogo de Semijoias</p>
        </div>

        {/* Lado Direito - Ações */}
        <div className="flex-1 flex justify-end gap-8 items-center">
          <Link href="/cart" className="flex items-center gap-2 group">
             <div className="p-2 rounded-full hover:bg-rose-50 transition-colors">
               <ShoppingBag size={18} className="text-[#7a5c58] group-hover:text-[#c99090] transition-colors" />
             </div>
             <span className="text-[9px] font-light tracking-[0.2em] uppercase text-[#7a5c58] hidden sm:block">Carrinho</span>
          </Link>
          
          <Link href="/login" className="flex items-center gap-2 group">
             <div className="p-2 rounded-full hover:bg-rose-50 transition-colors">
               <User size={18} className="text-[#7a5c58] group-hover:text-[#c99090] transition-colors" />
             </div>
             <span className="text-[9px] font-light tracking-[0.2em] uppercase text-[#7a5c58] hidden sm:block">Minha Conta</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
