'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  image_url: string
  material_finish?: string
  description?: string
  [key: string]: unknown
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (index: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const savedCart = localStorage.getItem('lapidado-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Erro ao carregar carrinho:', e)
      }
    }
  }, [])

  // Salvar no localStorage sempre que o carrinho mudar
  useEffect(() => {
    localStorage.setItem('lapidado-cart', JSON.stringify(cart))
    // Notificar outras abas/componentes que ainda usem localStorage diretamente
    window.dispatchEvent(new Event('cart-updated'))
  }, [cart])

  const addToCart = React.useCallback((item: CartItem) => {
    setCart(prev => [...prev, item])
  }, [])

  const removeFromCart = React.useCallback((index: number) => {
    setCart(prev => {
      const newCart = [...prev]
      newCart.splice(index, 1)
      return newCart
    })
  }, [])

  const clearCart = React.useCallback(() => {
    setCart([])
  }, [])

  const total = React.useMemo(() => cart.reduce((acc, item) => acc + (item.price || 0), 0), [cart])
  const itemCount = React.useMemo(() => cart.length, [cart])

  const value = React.useMemo(() => ({
    cart, addToCart, removeFromCart, clearCart, total, itemCount
  }), [cart, addToCart, removeFromCart, clearCart, total, itemCount])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
