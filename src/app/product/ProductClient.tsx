'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, notFound, useSearchParams } from 'next/navigation'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ProductClient({ initialProduct, initialBranding }: { initialProduct?: any, initialBranding?: any }) {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  
  const [product, setProduct] = useState<any>(initialProduct || null)
  const [branding, setBranding] = useState<any>(initialBranding || null)
  const [loading, setLoading] = useState(!initialProduct)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (initialProduct && initialBranding) return
    if (!id) {
      setLoading(false)
      return
    }

    async function loadProduct() {
      setLoading(true)
      
      const { data: prod } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('id', id)
        .single()

      if (!prod) {
        setLoading(false)
        return
      }

      setProduct(prod)

      const { data: brand } = await supabase
        .from('branding')
        .select('*')
        .eq('user_id', prod.user_id)
        .single()

      setBranding(brand)
      setLoading(false)
    }

    loadProduct()
  }, [id, supabase, initialProduct, initialBranding])

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  if (!id || !product) {
    notFound()
  }

  const brand = branding
  const storeSlug = brand?.slug || ''
  const installments = brand?.installments || parseInt(brand?.facebook?.split('|')[1] || '10')
  const backUrl = `/?catalogo=true${storeSlug ? `&loja=${storeSlug}` : ''}`

  let displayDescription = product.description || ''
  let materialFinish = product.material_finish || ''

  if (displayDescription.includes('---')) {
    const parts = displayDescription.split('---')
    displayDescription = parts[0].trim()
    
    if (!materialFinish) {
      const match = product.description?.match(/DATA:({.*})/)
      if (match) {
        try {
          const extraData = JSON.parse(match[1])
          materialFinish = extraData.finish
        } catch {}
      }
    }
  }

  const handleBack = () => {
    if (document.referrer.includes(window.location.origin)) {
      router.back()
    } else {
      router.push(backUrl)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
      <div className="w-full mb-12 md:mb-20 text-center">
        <button 
          onClick={handleBack}
          className="text-[10px] font-light tracking-[0.4em] uppercase text-brand-secondary hover:text-brand-primary transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={14} /> Voltar ao Catálogo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center w-full">
        <div className="relative aspect-[4/5] bg-white rounded-[80px] overflow-hidden shadow-2xl border border-brand-secondary/10 mx-auto w-full max-w-lg">
          {product.image_url && product.image_url.length > 5 ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-brand-secondary/5 text-brand-secondary/20 gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-brand-secondary/20 flex items-center justify-center">
                <span className="text-4xl">💎</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Foto não disponível</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center max-w-xl mx-auto lg:mx-0">
          <span className="text-brand-secondary font-light tracking-[0.5em] uppercase text-[10px] mb-6 block">{product.categories?.name || 'Joia'}</span>
          <h2 className="text-4xl font-normal tracking-[0.1em] uppercase text-brand-primary mb-10 leading-tight">{product.name}</h2>
          
          <div className="flex flex-col items-center gap-4 mb-16">
            <span className="text-5xl font-light text-brand-primary">
              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-brand-secondary text-sm font-light tracking-widest uppercase">
              {installments}x de R$ {(product.price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros
            </p>
          </div>

          <div className="space-y-8 mb-20 w-full flex flex-col items-center border-t border-brand-secondary/10 pt-16 text-center">
            {materialFinish && (
              <div className="px-6 py-2 bg-brand-secondary/5 border border-brand-secondary/10 rounded-full mb-8">
                <span className="text-[10px] font-black text-brand-secondary uppercase tracking-[0.3em]">
                  Acabamento: {materialFinish}
                </span>
              </div>
            )}
            <h3 className="text-[9px] font-semibold text-brand-primary uppercase tracking-[0.5em] mb-4">
              Descrição da Peça
            </h3>
            <p className="text-xl text-brand-primary/80 font-light leading-relaxed max-w-2xl whitespace-pre-wrap">
              {displayDescription}
            </p>
          </div>

          <div className="w-full flex flex-col items-center gap-4">
            <div className="w-full">
              <AddToCartButton product={{ 
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                description: product.description ?? undefined,
                material_finish: materialFinish
              }} />
            </div>
            
            <Link 
              href={backUrl}
              className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-secondary hover:text-brand-primary transition-all py-4 px-8 border border-brand-secondary/10 rounded-full bg-white/50"
            >
              ← Escolher mais Joias
            </Link>
          </div>
          
          {brand?.warranty_time && (
            <p className="mt-20 text-[9px] text-brand-primary/60 font-light opacity-50 tracking-[0.3em] uppercase text-center max-w-xs">
              💎 {brand.warranty_time.toUpperCase().includes('GARANTIA') ? brand.warranty_time : `${brand.warranty_time} DE GARANTIA`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
