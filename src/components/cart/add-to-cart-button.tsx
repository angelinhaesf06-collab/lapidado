'use client'

import { Gem, Check } from 'lucide-react'
import { useState } from 'react'

export default function AddToCartButton({ product }: { product: any }) {
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('lapidado-cart') || '[]')
    cart.push(product)
    localStorage.setItem('lapidado-cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button 
      onClick={handleAddToCart}
      disabled={added}
      className={`w-full px-6 py-3.5 md:py-5 rounded-[40px] md:rounded-[56px] text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all transform hover:scale-[1.03] shadow-xl active:scale-[0.97] flex items-center justify-center gap-3 md:gap-4 border-2 border-transparent ${
        added 
        ? 'bg-green-500/10 text-green-700 border-green-200 cursor-default shadow-none' 
        : 'bg-[#4a322e] text-white hover:bg-[#c99090] hover:shadow-rose-200'
      }`}
    >
      {added ? (
        <>
          <Check size={16} className="text-green-600" /> <span className="truncate">Adicionado ✨</span>
        </>
      ) : (
        <>
          <span className="truncate">Eu Quero</span>
          <div className="w-5 h-5 md:w-6 md:h-6 bg-white/10 rounded-full flex items-center justify-center">
             <Gem size={12} className="opacity-80 md:w-4 md:h-4 text-white" strokeWidth={2} />
          </div>
        </>
      )}
    </button>
  )
}
