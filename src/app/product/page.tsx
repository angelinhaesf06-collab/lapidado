'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, notFound, useSearchParams } from 'next/navigation'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Loader2, ArrowLeft } from 'lucide-react'

function ProductContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  
  const [product, setProduct] = useState<unknown>(null)
  const [branding, setBranding] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
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
  }, [id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  const prod = product as { 
    id: string;
    name: string; 
    price: number; 
    description: string | null; 
    image_url: string; 
    material_finish?: string;
    categories?: { name: string };
    user_id: string;
  };
  const brand = branding as { slug?: string; facebook?: string; tiktok?: string } | null;

  if (!id || !prod) {
    notFound()
  }

  const storeSlug = brand?.slug || ''
  const installments = parseInt(brand?.facebook?.split('|')[1] || '10')
  const backUrl = `/?catalogo=true${storeSlug ? `&loja=${storeSlug}` : ''}`

  let displayDescription = prod.description || ''
  let materialFinish = prod.material_finish || ''

  if (displayDescription.includes('---')) {
    const parts = displayDescription.split('---')
    displayDescription = parts[0].trim()
    
    if (!materialFinish) {
      const match = prod.description?.match(/DATA:({.*})/)
      if (match) {
        try {
          const extraData = JSON.parse(match[1])
          materialFinish = extraData.finish
        } catch {}
      }
    }
  }

  const handleBack = () => {
    // Tenta voltar pelo histórico se viemos do catálogo, senão vai para a URL
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
          <Image src={prod.image_url} alt={prod.name} className="object-cover" fill sizes="(max-width: 768px) 100vw, 50vw" priority />
        </div>

        <div className="flex flex-col items-center text-center max-w-xl mx-auto lg:mx-0">
          <span className="text-brand-secondary font-light tracking-[0.5em] uppercase text-[10px] mb-6 block">{prod.categories?.name || 'Joia'}</span>
          <h2 className="text-4xl font-normal tracking-[0.1em] uppercase text-brand-primary mb-10 leading-tight">{prod.name}</h2>
          
          <div className="flex flex-col items-center gap-4 mb-16">
            <span className="text-5xl font-light text-brand-primary">
              R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-brand-secondary text-sm font-light tracking-widest uppercase">
              {installments}x de R$ {(prod.price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
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
            <p className="text-xl text-brand-primary/80 font-light leading-relaxed max-w-md">
              {displayDescription}
            </p>
          </div>

          <div className="w-fit">
            <AddToCartButton product={{ 
              id: prod.id,
              name: prod.name,
              price: prod.price,
              image_url: prod.image_url,
              description: prod.description ?? undefined,
              material_finish: materialFinish
            }} />
          </div>
          
          {brand?.tiktok && (
            <p className="mt-20 text-[9px] text-brand-primary/60 font-light opacity-50 tracking-[0.3em] uppercase text-center max-w-xs">
              💎 {brand.tiktok.toUpperCase().includes('GARANTIA') ? brand.tiktok : `${brand.tiktok} DE GARANTIA`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
            <ProductContent />
        </Suspense>
    )
}
