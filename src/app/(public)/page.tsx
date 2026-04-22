'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { CartItem } from '@/lib/cart-context'

interface Category {
  id: string
  name: string
}

interface Branding {
  id: string
  user_id: string
  slug: string
  store_name: string
  facebook?: string
  [key: string]: unknown
}

function HomeContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<CartItem[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(true)
  
  const isPublicCatalog = searchParams.get('catalogo') === 'true'
  const storeSlug = searchParams.get('loja')
  const activeCategory = searchParams.get('category') || 'Todos'
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (!isPublicCatalog) {
      router.push('/login')
      return
    }

    async function loadData() {
      setLoading(true)
      
      let currentBranding = null
      if (storeSlug) {
        const { data } = await supabase.from('branding').select('*').eq('slug', storeSlug).single()
        currentBranding = data
      }

      if (!currentBranding) {
        const { data } = await supabase.from('branding').select('*').eq('store_name', 'YES MORE GOLD').limit(1).maybeSingle()
        currentBranding = data
      }
      
      if (!currentBranding) {
        const { data } = await supabase.from('branding').select('*').limit(1).maybeSingle()
        currentBranding = data
      }

      setBranding(currentBranding)
      const currentUserId = currentBranding?.user_id || '00000000-0000-0000-0000-000000000000'

      const { data: cats } = await supabase.from('categories').select('id, name').eq('user_id', currentUserId).order('name')
      setDbCategories(cats || [])

      let prodQuery = supabase.from('products')
        .select('*, categories!inner(name)')
        .eq('user_id', currentUserId)
        .gt('stock_quantity', 0)
      
      if (activeCategory !== 'Todos') {
        prodQuery = prodQuery.eq('categories.name', activeCategory)
      }

      const { data: prods } = await prodQuery.order('created_at', { ascending: false })
      setProducts(prods || [])
      setLoading(false)
    }

    loadData()
  }, [isPublicCatalog, storeSlug, activeCategory, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  const categoryNames = ['Todos', ...dbCategories.map(c => c.name)]
  const installments = parseInt(branding?.facebook?.split('|')[1] || '10')
  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  return (
    <div className="flex flex-col w-full min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md border-b border-brand-secondary/10 sticky top-[56px] md:top-[72px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 py-2 md:py-3 flex flex-wrap justify-center gap-2 md:gap-6 min-h-[40px] items-center">
          {dbCategories.length > 0 ? (
            categoryNames.map((cat) => (
              <Link 
                key={cat}
                href={`/?catalogo=true&category=${cat === 'Todos' ? '' : cat}${storeParam}`}
                className={`px-3 py-1.5 transition-all font-bold text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-full border ${
                  activeCategory === cat
                  ? "bg-brand-primary text-white border-brand-primary shadow-md" 
                  : "text-brand-primary/70 hover:text-brand-primary bg-brand-secondary/5 border-brand-secondary/10"
                }`}
              >
                {cat}
              </Link>
            ))
          ) : (
            <div className="flex items-center gap-3 px-4 py-1">
              <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase text-brand-primary/40">
                Coleções Exclusivas
              </span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 w-full text-center">
        <div className="mb-8 md:mb-16">
          <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] uppercase text-brand-primary mb-2">
            {activeCategory === 'Todos' ? 'Coleção Completa' : activeCategory}
          </h2>
          <div className="w-12 h-[1px] bg-brand-secondary/30 mx-auto mb-2" />
          <p className="text-brand-secondary text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase opacity-60">{products.length} Itens Selecionados</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-10 gap-y-10 md:gap-y-20 px-1">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="group flex flex-col items-center">
                <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full">
                  <div className="aspect-[4/5] w-full bg-white rounded-[40px] md:rounded-[64px] overflow-hidden mb-6 md:mb-10 shadow-[0_20px_60px_rgba(74,50,46,0.08)] border border-white relative transition-all duration-700">
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-1000 z-10" 
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  
                  <div className="px-4 text-center w-full mb-8">
                    <h4 className="text-[10px] md:text-[13px] font-black tracking-[0.2em] md:tracking-[0.4em] uppercase text-brand-primary mb-2 w-full leading-relaxed">{product.name}</h4>
                    <div className="flex flex-col gap-1 md:gap-3">
                      <span className="text-[14px] md:text-[22px] font-bold text-brand-primary">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-brand-secondary text-[8px] md:text-[10px] font-black tracking-widest uppercase opacity-60">
                        {installments}x de R$ {(product.price / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="w-full max-w-[140px] md:max-w-none px-2 md:px-6 flex flex-col items-center gap-4">
                  <AddToCartButton product={product} />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-brand-primary/60 font-light tracking-widest uppercase">Nenhuma joia encontrada. 💎</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
      <HomeContent />
    </Suspense>
  )
}
