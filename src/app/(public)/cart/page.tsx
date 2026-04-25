'use client'

import { useState, useEffect } from 'react'
import { Trash2, MessageCircle, ShoppingBag, Banknote, User, MapPin } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/cart-context'

export default function CartPage() {
  const { cart, removeFromCart, total, itemCount } = useCart()
  const [storePhone, setStorePhone] = useState('5511999999999')
  const [storeName, setStoreName] = useState('LAPIDADO')
  const [storeSlug, setStoreSlug] = useState('') // 💎 NEXUS: Identidade da loja
  const [installments, setInstallments] = useState(10)
  
  // Dados do Cliente
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  useEffect(() => {
    const loadStoreData = async () => {
      const supabase = createClient()
      const urlParams = new URLSearchParams(window.location.search)
      const slugFromUrl = urlParams.get('loja')

      let query = supabase.from('branding').select('*')
      if (slugFromUrl) {
        query = query.eq('slug', slugFromUrl)
      } else {
        query = query.order('created_at', { ascending: false }).limit(1)
      }

      const { data } = await query.maybeSingle()
      
      if (data) {
        setStoreSlug(data.slug)
        if (data.business_name) {
          setStoreName(data.business_name)
        } else if (data.store_name) {
          setStoreName(data.store_name)
        }

        if (data.phone) {
          let cleanPhone = data.phone.replace(/\D/g, '')
          if (cleanPhone && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone
          setStorePhone(cleanPhone)
        }
        const parts = data.facebook?.split('|')
        if (parts && parts[1]) setInstallments(parseInt(parts[1]))
      }
    }
    loadStoreData()
  }, [])

  const installmentValue = total / installments
  const pixDiscount = 0.05
  const pixValue = total * (1 - pixDiscount)

  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  const sendWhatsApp = () => {
    if (!customerName) {
      alert('POR FAVOR, INFORME SEU NOME PARA CONTINUAR. ✨')
      return
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    
    const message = encodeURIComponent(
      `*🛒 NOVO PEDIDO - ${storeName.toUpperCase()}* ✨\n\n` +
      `*👤 CLIENTE:* ${customerName.toUpperCase()}\n` +
      (customerAddress ? `*📍 ENDEREÇO:* ${customerAddress.toUpperCase()}\n` : '') +
      `\n*💎 JOIAS SELECIONADAS:*\n` +
      cart.map(item => {
        let finish = item.material_finish || ''
        // Link para a peça na vitrine
        const productLink = `${baseUrl}/product/${item.id}?catalogo=true${storeParam}`
        return `• *${item.name}*${finish ? ` (${finish})` : ''}\n  💰 R$ ${item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n  🔗 _Ver foto:_ ${productLink}`
      }).join('\n\n') +
      `\n\n*💳 RESUMO FINANCEIRO:*\n` +
      `--------------------------\n` +
      `*TOTAL:* R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `*NO CARTÃO:* ${installments}X DE R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `*NO PIX (5% OFF):* R$ ${Number(pixValue.toFixed(2)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `--------------------------\n\n` +
      `*Olá, ${storeName}! Acabei de montar minha sacola no seu catálogo. Podemos combinar o envio?*`
    )
    window.open(`https://wa.me/${storePhone}?text=${message}`, '_blank')
  }

  if (itemCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <ShoppingBag size={48} className="text-brand-secondary/30 mb-6" />
        <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-brand-primary mb-4">Sua sacola está vazia</h2>
        <p className="text-brand-secondary text-[10px] tracking-widest uppercase mb-12 font-light">Escolha as joias que mais combinam com você</p>
        <Link href={`/?catalogo=true${storeParam}`} className="bg-brand-primary text-white px-12 py-4 rounded-full font-light text-[10px] tracking-[0.3em] uppercase hover:bg-brand-secondary transition-colors">
          Voltar ao Catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="text-center mb-20">
        <h2 className="text-3xl font-light tracking-[0.2em] uppercase text-brand-primary mb-4">Minha Sacola</h2>
        <p className="text-brand-secondary text-[10px] font-light tracking-[0.4em] uppercase">{itemCount} Itens Selecionados</p>
      </div>

      <div className="space-y-8 mb-16">
        {cart.map((item, index) => {
          let finish = item.material_finish || ''
          if (!finish && item.description?.includes('DATA:')) {
            try {
              const match = item.description.match(/DATA:({.*})/)
              if (match) finish = JSON.parse(match[1]).finish
            } catch {}
          }

          return (
            <div key={`${item.id}-${index}`} className="flex items-center gap-6 border-b border-brand-secondary/10 pb-8">
              <div className="w-24 h-32 rounded-3xl overflow-hidden bg-white border border-brand-secondary/10 shadow-sm relative">
                <Image src={item.image_url} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-normal tracking-[0.2em] uppercase text-brand-primary mb-1">{item.name}</h4>
                {finish && <p className="text-[8px] font-black text-brand-secondary uppercase tracking-widest mb-2">{finish}</p>}
                <p className="text-lg font-light text-brand-primary">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <button onClick={() => removeFromCart(index)} className="text-brand-secondary/40 hover:text-red-400 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          )
        })}
      </div>

      {/* FORMULÁRIO DE IDENTIFICAÇÃO */}
      <div className="mb-16 space-y-6">
        <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-brand-primary text-center">Identificação</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={18} />
            <input 
              type="text" 
              placeholder="SEU NOME COMPLETO" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-brand-secondary/10 bg-white text-[10px] font-bold tracking-widest text-brand-primary outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-secondary/40" size={18} />
            <input 
              type="text" 
              placeholder="ENDEREÇO DE ENTREGA (OPCIONAL)" 
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-brand-secondary/10 bg-white text-[10px] font-bold tracking-widest text-brand-primary outline-none focus:border-brand-primary transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-brand-secondary/5 p-10 rounded-[40px] text-center border border-brand-secondary/10 shadow-sm">
        <div className="mb-10">
          <p className="text-[10px] font-light tracking-[0.4em] uppercase text-brand-secondary mb-4">Valor Total do Pedido</p>
          <h3 className="text-4xl font-light text-brand-primary mb-2">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          <p className="text-[11px] font-light tracking-widest uppercase opacity-60 text-brand-primary">
            ou {installments}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros
          </p>
        </div>

        {/* BENEFÍCIO PIX */}
        <div className="mb-12 p-6 bg-white rounded-3xl border border-brand-secondary/10 flex items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-secondary/10 flex items-center justify-center text-brand-secondary">
            <Banknote size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-brand-secondary">Pague com PIX e ganhe 5% OFF</p>
            <p className="text-2xl font-normal text-brand-primary">R$ {Number(pixValue.toFixed(2)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <button 
          onClick={sendWhatsApp}
          className="w-full bg-[#25D366] text-white py-6 rounded-full font-light text-[11px] tracking-[0.3em] uppercase flex items-center justify-center gap-4 hover:brightness-105 shadow-xl shadow-green-100/50 transition-all"
        >
          <MessageCircle size={20} /> Finalizar no WhatsApp
        </button>
        
        <Link href={`/?catalogo=true${storeParam}`} className="inline-block mt-8 text-[9px] font-light tracking-[0.3em] uppercase text-brand-secondary hover:text-brand-primary transition-colors">
          ← Adicionar mais joias
        </Link>
      </div>
    </div>
  )
}
