'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import Link from 'next/link'

export default function CartIcon() {
  const { itemCount } = useCart()

  return (
    <Link 
      href="/cart"
      className="fixed bottom-8 right-8 p-4 bg-brand-primary text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group z-[100]"
    >
      <ShoppingBag size={24} />
      {itemCount > 0 && (
        <span className="bg-white text-brand-primary text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold group-hover:bg-brand-secondary group-hover:text-white transition-colors animate-in zoom-in">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
