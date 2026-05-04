'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import AddToCartButton from '@/components/cart/add-to-cart-button'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Gem } from 'lucide-react'

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
  instagram?: string
  tiktok?: string
  phone?: string
  logo_url?: string
  top_banner?: string
  installments?: number | string
  [key: string]: any
}

export default function CatalogClient() {
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
        let currentBranding: Branding | null = null
        
        // 1. Identificar qual marca estamos acessando
        if (storeSlug) {
          const { data } = await supabase.from('branding').select('*').eq('slug', storeSlug).maybeSingle()
          currentBranding = data as Branding | null
        } 
        
        // 2. Se não houver slug, tenta identificar pelo usuário logado (Dona da Loja)
        if (!currentBranding) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from('branding').select('*').eq('user_id', user.id).maybeSingle()
            currentBranding = data as Branding | null
          }
        }
        
        // 💎 ISOLAMENTO CRÍTICO: Se ainda assim não encontrou, bloqueia o acesso
        if (!currentBranding) {
          console.error("MARCA NÃO ENCONTRADA OU ACESSO NÃO AUTORIZADO")
          setBranding(null)
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
            .order('display_order', { ascending: true, nullsFirst: true })
            .order('created_at', { ascending: false })
            .limit(100)
        ])

        setDbCategories(catsRes.data || [])
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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
        } else {
          await loadInitialData()
        }
      }
    }

    checkAccess()
  }, [isPublicCatalog, storeSlug, router, supabase])

  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeCategory, loading])

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
      const b = branding as any
      if (b?.installments) return parseInt(b.installments.toString())
      const parts = b?.facebook?.split('|')
      if (parts && parts[1]) {
        const val = parseInt(parts[1])
        return isNaN(val) ? 10 : val
      }
    } catch {
      // Erro ignorado propositalmente
    }
    return 10
  }, [branding])

  const categoryNames = ['Todos', ...dbCategories.map(c => c.name)]
  const storeParam = storeSlug ? `&loja=${storeSlug}` : ''

  if (loading && allProducts.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>
  }

  if (!loading && !branding && isPublicCatalog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center bg-[#fffcfc]">
        <Gem size={48} className="text-brand-secondary/20 mb-6" />
        <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-brand-primary mb-4">Catálogo Indisponível</h2>
        <p className="text-brand-secondary text-[10px] tracking-widest uppercase mb-12 font-light max-w-xs">
          Não conseguimos encontrar esta vitrine. Verifique se o link está correto ou tente novamente mais tarde.
        </p>
        <Link href="/" className="bg-brand-primary text-white px-12 py-4 rounded-full font-black text-[10px] tracking-[0.3em] uppercase shadow-lg shadow-brand-primary/20">
          Ir para a Home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#fffcfc] animate-in fade-in duration-700">
      
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brand-secondary/10 shadow-sm">
        <header className="w-full pt-8 pb-4 flex flex-col items-center gap-6">
          {branding?.logo_url && typeof branding.logo_url === 'string' ? (
            <Link href={`/?catalogo=true${storeParam}`} className="relative w-40 h-14 md:w-64 md:h-20 transition-all duration-500 hover:scale-110 active:scale-95">
              <Image 
                src={branding.logo_url} 
                alt={branding.store_name || 'Logo'} 
                fill 
                className="object-contain filter drop-shadow-sm"
                priority
              />
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
                  <Gem size={24} />
               </div>
               <h1 className="text-[12px] md:text-[16px] font-black uppercase tracking-[0.6em] text-brand-primary">
                  {branding?.store_name || 'LAPIDADO'}
               </h1>
            </div>
          )}
          
          {branding?.tagline && (
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-secondary/60 max-w-[80%] text-center leading-relaxed">
              {branding.tagline}
            </p>
          )}
        </header>

        <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-2 md:gap-4 items-center">
          {categoryNames.map((cat) => (
            <Link 
              key={cat}
              href={`/?catalogo=true&category=${cat === 'Todos' ? '' : cat}${storeParam}`}
              className={`px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 font-black text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] uppercase rounded-full border ${
                activeCategory === cat || (cat === 'Todos' && !activeCategory)
                ? "bg-brand-primary text-white border-brand-primary shadow-lg scale-105" 
                : "text-brand-primary/60 hover:text-brand-primary bg-white border-brand-secondary/10 hover:border-brand-primary/30"
              }`}
            >
              {cat}
            </Link>
          ))}
        </nav>
      </div>

      {(branding?.top_banner || branding?.facebook?.split('|')[2]) && (
        <div className="w-full bg-brand-primary py-2 px-4 text-center">
          <p className="text-white text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">
            ✨ {(branding?.top_banner || branding?.facebook?.split('|')[2]) as string} ✨
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16 w-full text-center">
        <div className="mb-8 md:mb-16">
          <h2 className="text-lg md:text-2xl font-light tracking-[0.4em] uppercase text-brand-primary mb-4 animate-in slide-in-from-bottom-2 duration-700">
            {activeCategory === 'Todos' || !activeCategory ? `${branding?.store_name || 'Coleção'} Exclusiva` : activeCategory}
          </h2>
          <div className="w-12 h-[1px] bg-brand-secondary/40 mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-12 gap-y-10 md:gap-y-24 px-1 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {displayedProducts.map((product) => (
            <div key={product.id} className="group flex flex-col items-center w-full">
              <Link href={`/product?id=${product.id}&catalogo=true${storeParam}`} className="w-full focus:outline-none">
                <div className="aspect-[4/5] w-full bg-white rounded-[32px] md:rounded-[50px] overflow-hidden mb-5 shadow-[0_20px_50px_rgba(74,50,46,0.04)] border border-white relative transition-all duration-500 group-hover:shadow-[0_30px_70px_rgba(74,50,46,0.1)] group-hover:-translate-y-2">
                  {product.image_url ? (
                    <Image 
                      src={product.image_url} 
                      alt={product.name} 
                      fill 
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-[1.5s] group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-secondary/5">
                      <Gem size={32} className="text-brand-secondary/20" />
                    </div>
                  )}
                </div>
                
                <div className="px-1 text-center w-full mb-5">
                  <h4 className="text-[9px] md:text-[12px] font-black tracking-[0.2em] uppercase text-brand-primary mb-2 leading-relaxed transition-colors group-hover:text-brand-secondary truncate px-2">{product.name}</h4>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] md:text-[20px] font-bold text-brand-primary">
                      R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <p className="text-brand-secondary text-[7px] md:text-[9px] font-black tracking-widest uppercase opacity-40">
                      {installments}x de R$ {(Number(product.price) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="w-full px-1 md:px-6">
                <AddToCartButton product={product} />
              </div>
            </div>
          ))}
        </div>
        
        {displayedProducts.length === 0 && !loading && (
          <div className="py-20">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-secondary/30">Nenhum item nesta categoria 💎</p>
          </div>
        )}
      </div>
    </div>
  )
}
