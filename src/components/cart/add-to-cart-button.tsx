'use client'

import { Gem, Check } from 'lucide-react'
import { useState } from 'react'
import { useCart, type CartItem } from '@/lib/cart-context'

export default function AddToCartButton({ product }: { product: CartItem }) {
  const [added, setAdded] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    addToCart(product)
    
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button 
      onClick={handleAddToCart}
      disabled={added}
      className={`w-full px-3 md:px-6 py-3 md:py-5 rounded-[40px] md:rounded-[56px] text-[8px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.4em] transition-all transform hover:scale-[1.03] shadow-xl active:scale-[0.97] flex items-center justify-center gap-2 md:gap-4 border-2 border-transparent ${
        added 
        ? 'bg-green-500/10 text-green-700 border-green-200 cursor-default shadow-none' 
        : 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-brand-secondary/30'
      }`}
    >
      {added ? (
        <>
          <Check size={14} className="text-green-600" /> <span className="truncate">Adicionado</span>
        </>
      ) : (
        <>
          <span className="truncate">Eu Quero</span>
          <div className="w-4 h-4 md:w-6 md:h-6 bg-white/10 rounded-full flex items-center justify-center shrink-0">
             <Gem size={10} className="opacity-80 md:w-4 md:h-4 text-white" strokeWidth={2} />
          </div>
        </>
      )}
    </button>
  )
}
