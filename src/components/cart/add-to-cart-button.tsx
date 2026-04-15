'use client'

import { ShoppingBag, Check } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/lib/cart-context'

export default function AddToCartButton({ product }: { product: any }) {
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
      className={`w-full px-4 md:px-12 py-2.5 md:py-4 rounded-full font-light text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase transition-all transform hover:scale-[1.02] shadow-lg active:scale-95 flex items-center justify-center gap-2 md:gap-4 ${
        added 
        ? 'bg-green-600 text-white cursor-default' 
        : 'bg-brand-primary text-white hover:bg-brand-secondary'
      }`}
    >
      {added ? (
        <>
          <Check size={14} className="animate-bounce md:w-4 md:h-4" /> <span className="truncate">Na Sacola! ✨</span>
        </>
      ) : (
        <>
          <ShoppingBag size={14} className="opacity-70 md:w-4 md:h-4" /> <span className="truncate">Comprar</span>
        </>
      )}
    </button>
  )
}
