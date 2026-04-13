'use client'

import { useState, useEffect } from 'react'
import { Trash2, MessageCircle, ShoppingBag, Banknote } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('lapidado-cart') || '[]')
    }
    return []
  })
  const [storePhone, setStorePhone] = useState('5511999999999')

  useEffect(() => {
    const loadStorePhone = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('branding').select('phone, business_name').single()
      if (data && data.phone) {
        let cleanPhone = data.phone.replace(/\D/g, '')
        if (cleanPhone && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone
        setStorePhone(cleanPhone)
      }
    }
    loadStorePhone()
  }, [])

  const removeItem = (index: number) => {
    const newCart = [...cartItems]
    newCart.splice(index, 1)
    setCartItems(newCart)
    localStorage.setItem('lapidado-cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const total = cartItems.reduce((acc, item) => acc + item.price, 0)
  const installments = 10
  const installmentValue = total / installments
  
  // Cálculo de Desconto PIX (5%)
  const pixDiscount = 0.05
  const pixValue = total * (1 - pixDiscount)

  const sendWhatsApp = () => {
    const message = encodeURIComponent(
      `OLÁ ANGELA! ✨ GOSTARIA DE ENCOMENDAR ESTAS PEÇAS:\n\n` +
      cartItems.map(item => `- ${item.name} (R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`).join('\n') +
      `\n\nVALOR TOTAL: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `PARCELAMENTO: ${installments}X DE R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `VALOR NO PIX (5% DESC): R$ ${pixValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `PODEMOS COMBINAR O ENVIO?`
    )
    window.open(`https://wa.me/${storePhone}?text=${message}`, '_blank')
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <ShoppingBag size={48} className="text-rose-100 mb-6" />
        <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-[#4a322e] mb-4">Sua sacola está vazia</h2>
        <p className="text-[#c99090] text-[10px] tracking-widest uppercase mb-12 font-light">Escolha as joias que mais combinam com você</p>
        <Link href="/" className="bg-[#4a322e] text-white px-12 py-4 rounded-full font-light text-[10px] tracking-[0.3em] uppercase">
          Voltar ao Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="text-center mb-20">
        <h2 className="text-3xl font-light tracking-[0.2em] uppercase text-[#4a322e] mb-4">Minha Sacola</h2>
        <p className="text-[#c99090] text-[10px] font-light tracking-[0.4em] uppercase">{cartItems.length} Itens Selecionados</p>
      </div>

      <div className="space-y-8 mb-16">
        {cartItems.map((item, index) => (
          <div key={index} className="flex items-center gap-6 border-b border-rose-50 pb-8">
            <div className="w-24 h-32 rounded-3xl overflow-hidden bg-white border border-rose-50 shadow-sm">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-normal tracking-[0.2em] uppercase text-[#4a322e] mb-2">{item.name}</h4>
              <p className="text-lg font-light text-[#4a322e]">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <button onClick={() => removeItem(index)} className="text-rose-200 hover:text-red-400 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-[#fdf2f2] p-10 rounded-[40px] text-center border border-rose-50 shadow-sm">
        <div className="mb-10">
          <p className="text-[10px] font-light tracking-[0.4em] uppercase text-[#c99090] mb-4">Valor Total do Pedido</p>
          <h3 className="text-4xl font-light text-[#4a322e] mb-2">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[11px] font-light tracking-widest uppercase opacity-60 text-[#4a322e]">
            ou {installments}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
          </p>
        </div>

        {/* BENEFÍCIO PIX */}
        <div className="mb-12 p-6 bg-white rounded-3xl border border-rose-100 flex items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#c99090]">
            <Banknote size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c99090]">Pague com PIX e ganhe 5% OFF</p>
            <p className="text-2xl font-normal text-[#4a322e]">R$ {pixValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <button 
          onClick={sendWhatsApp}
          className="w-full bg-[#25D366] text-white py-6 rounded-full font-light text-[11px] tracking-[0.3em] uppercase flex items-center justify-center gap-4 hover:brightness-105 shadow-xl shadow-green-100/50 transition-all"
        >
          <MessageCircle size={20} /> Finalizar no WhatsApp
        </button>
        
        <Link href="/" className="inline-block mt-8 text-[9px] font-light tracking-[0.3em] uppercase text-[#7a5c58] hover:text-[#4a322e] transition-colors">
          ← Adicionar mais joias
        </Link>
      </div>
    </div>
  )
}
