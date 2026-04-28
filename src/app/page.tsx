'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Gem } from 'lucide-react'
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
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(true)
  
  const storeSlug = searchParams.get('loja')
  const isPublicCatalog = searchParams.get('catalogo') === 'true' || !!storeSlug
  const activeCategory = searchParams.get('category') || 'Todos'
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true)
      
      try {
        let brandingQuery = supabase.from('branding').select('*')
        
        if (storeSlug) {
          brandingQuery = brandingQuery.eq('slug', storeSlug)
        } else {
          brandingQuery = brandingQuery.eq('slug', 'angel-semijoias')
        }
        
        let { data: currentBranding } = await brandingQuery.maybeSingle()

        if (!currentBranding) {
          const { data: firstBrand } = await supabase.from('branding').select('*').limit(1).maybeSingle()
          currentBranding = firstBrand
        }

        if (!currentBranding) {
          setLoading(false)
          return
        }

        setBranding(currentBranding)
        const currentUserId = currentBranding.user_id

        const [catsRes, prodsRes] = await Promise.all([
          supabase.from('categories').select('id, name').eq('user_id', currentUserId).order('name'),
          supabase.from('products')
            .select('id, name, price, image_url, category_id, stock_quantity')
            .eq('user_id', currentUserId)
            .gt('stock_quantity', 0)
            .order('created_at', { ascending: false })
            .limit(100)
        ])

        // 💎 NEXUS: Fallback resiliente apenas se não encontrar nada para o lojista
        let finalCategories = catsRes.data || []
        if (finalCategories.length === 0) {
          const { data: fallbackCats } = await supabase.from('categories').select('id, name').limit(20)
          finalCategories = fallbackCats || []
        }

        setDbCategories(finalCategories)
        setAllProducts(prodsRes.data || [])
      } catch (err) {
        console.error("Erro ao carregar vitrine:", err)
      } finally {
        setLoading(false)
      }
    }

    const checkAccess = async () => {
      if (isPublicCatalog) {
        await loadInitialData()
      } else {
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          router.push('/login')
        } else {
          await loadInitialData()
        }
      }
    }

    checkAccess()
  }, [isPublicCatalog, storeSlug, router, supabase])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeCategory])

  const displayedProducts = useMemo(() => {
    if (!allProducts) return []
    if (activeCategory === 'Todos' || !activeCategory) {
      return allProducts
    }
    return allProducts.filter(p => {
      const cat = dbCategories.find(c => c.id === p.category_id)
      return cat?.name === activeCategory
    })
  }, [allProducts, activeCategory, dbCategories])

  const installments = useMemo(() => {
    try {
      // @ts-ignore
      if (branding?.installments) return parseInt(branding.installments.toString())
      const parts = branding?.facebook?.split('|')
      if (parts && parts[1]) {
        const val = parseInt(parts[1])
        return isNaN(val) ? 10 : val
      }
    } catch (e) {}
    return 10
  }, [branding])

  if (loading && allProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  const categoryNames = ['Todos', ...dbCategories.map(c => c.name)]
  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fffcfc]">
      {/* 💎 HEADER LUXUOSO DA VITRINE */}
      <header className="w-full bg-white pt-12 pb-8 flex flex-col items-center gap-6 border-b border-brand-secondary/5">
        {branding?.logo_url && typeof branding.logo_url === 'string' ? (
          <div className="relative w-48 h-16 md:w-64 md:h-20 animate-fade-in">
            <Image 
              src={branding.logo_url} 
              alt={branding.store_name || 'Logo'} 
              fill 
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg">
                <Gem size={24} />
             </div>
             <h1 className="text-[14px] font-black uppercase tracking-[0.4em] text-brand-primary">
                {branding?.store_name || 'LAPIDADO'}
             </h1>
          </div>
        )}
        
        <p className="text-[9px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-brand-secondary/60">
           {branding?.facebook?.split('|')[3] || 'Joalheria Contemporânea'}
        </p>
      </header>

      {/* 🏷️ BARRA DE CATEGORIAS STICKY */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-brand-secondary/10 sticky top-0 z-40 shadow-sm overflow-x-auto scrollbar-hide">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-start md:justify-center gap-2 md:gap-4 min-w-max items-center">
          {categoryNames.map((cat) => (
            <Link 
              key={cat}
              href={`/?catalogo=true&category=${cat === 'Todos' ? '' : cat}${storeParam}`}
              className={`px-5 py-2 transition-all duration-500 font-black text-[9px] md:text-[10px] tracking-[0.2em] uppercase rounded-full border ${
                activeCategory === cat || (cat === 'Todos' && !activeCategory)
                ? "bg-brand-primary text-white border-brand-primary shadow-xl scale-105" 
                : "text-brand-primary/60 hover:text-brand-primary bg-white border-brand-secondary/10"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      {branding?.facebook?.split('|')[2] && (
        <div className="w-full bg-brand-primary py-2.5 px-4 text-center">
          <p className="text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">
            ✨ {branding.facebook.split('|')[2]} ✨
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 w-full text-center">
        <div className="mb-12 md:mb-24">
          <h2 className="text-xl md:text-3xl font-light tracking-[0.4em] uppercase text-brand-primary mb-4">
            {activeCategory === 'Todos' || !activeCategory ? 'Nova Coleção' : activeCategory}
          </h2>
          <div className="w-16 h-[1px] bg-brand-secondary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-12 md:gap-y-32 px-1">
          {displayedProducts.map((product) => (
            <div key={product.id} className="group flex flex-col items-center w-full">
              <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full focus:outline-none">
                <div className="aspect-[4/5] w-full bg-white rounded-[32px] md:rounded-[60px] overflow-hidden mb-6 shadow-[0_30px_80px_rgba(74,50,46,0.06)] border border-white relative transition-all duration-700 group-hover:shadow-[0_40px_100px_rgba(74,50,46,0.12)] group-hover:-translate-y-2">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-[2s] group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-secondary/5">
                      <Gem size={40} className="text-brand-secondary/20" />
                    </div>
                  )}
                </div>
                
                <div className="px-2 text-center w-full mb-6">
                  <h4 className="text-[10px] md:text-[14px] font-black tracking-[0.3em] uppercase text-brand-primary mb-3 leading-relaxed transition-colors group-hover:text-brand-secondary">{product.name}</h4>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[15px] md:text-[24px] font-bold text-brand-primary">
                      R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-brand-secondary text-[8px] md:text-[10px] font-black tracking-widest uppercase opacity-40">
                      {installments}x de R$ {(Number(product.price) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="w-full px-1 md:px-8">
                <AddToCartButton product={product} />
              </div>
            </div>
          ))}
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
