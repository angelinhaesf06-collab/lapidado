'use client'

import { ShoppingBag } from 'lucide-react'

export default function AddToCartButton({ product }: { product: any }) {
  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('lapidado-cart') || '[]')
    cart.push(product)
    localStorage.setItem('lapidado-cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    alert(`PEÇA ADICIONADA À SACOLA ✨`)
  }

  return (
    <button 
      onClick={handleAddToCart}
      className="bg-[#4a322e] text-white px-12 py-4 rounded-full font-light text-[10px] tracking-[0.3em] uppercase hover:bg-[#c99090] transition-all transform hover:scale-[1.02] shadow-lg active:scale-95 flex items-center gap-4"
    >
      <ShoppingBag size={16} className="opacity-70" /> Adicionar na Sacola
    </button>
  )
}
