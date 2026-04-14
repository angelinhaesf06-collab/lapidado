'use client'

import { ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CartIcon() {
  const [count, setCount] = useState(0)

  // Sincronizar com localStorage para o preview
  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('lapidado-cart') || '[]')
      setCount(cart.length)
    }
    
    updateCount()
    window.addEventListener('storage', updateCount)
    window.addEventListener('cart-updated', updateCount)
    return () => {
      window.removeEventListener('storage', updateCount)
      window.removeEventListener('cart-updated', updateCount)
    }
  }, [])

  return (
    <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg border border-brand-secondary/10 text-brand-secondary hover:scale-110 transition-transform flex items-center gap-2 group">
      <ShoppingBag size={24} />
      {count > 0 && (
        <span className="bg-brand-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold group-hover:bg-brand-primary animate-in zoom-in">
          {count}
        </span>
      )}
    </button>
  )
}
