'use client'

import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CartIcon() {
  const { itemCount } = useCart()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const storeSlug = searchParams.get('loja')
  const isCatalogo = searchParams.get('catalogo') === 'true'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 💎 NEXUS: Prevenção de Flashes e Renderizações Incorretas
  const isAuthPage = !!pathname && (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/auth'));
  const isAdminPage = !!pathname && pathname.includes('/admin');
  
  if (!mounted || isAuthPage || isAdminPage) return null;

  const cartUrl = `/cart?${isCatalogo ? 'catalogo=true' : ''}${storeSlug ? `&loja=${storeSlug}` : ''}`

  return (
    <Link 
      href={cartUrl}
      className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom,0px))] md:bottom-auto md:top-[50%] right-4 md:right-8 p-3 md:p-4 bg-brand-primary text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group z-[40]"
    >
      <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
      {itemCount > 0 && (
        <span className="bg-white text-brand-primary text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold group-hover:bg-brand-secondary group-hover:text-white transition-colors animate-in zoom-in">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
