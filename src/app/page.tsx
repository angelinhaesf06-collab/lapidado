'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CatalogClient from './CatalogClient'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function Home() {
  const searchParams = useSearchParams()
  const loja = searchParams.get('loja')
  const catalogo = searchParams.get('catalogo')
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{branding: any, products: any[], categories: any[]}>({
    branding: null,
    products: [],
    categories: []
  })
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!loja && catalogo !== 'true') {
        if (user) {
          router.replace('/admin')
        } else {
          router.replace('/login')
        }
        return
      }

      if (loja) {
        try {
          const { data: branding } = await supabase.from('branding')
            .select('*')
            .eq('slug', loja)
            .maybeSingle()

          if (branding) {
            const { data: products } = await supabase.from('products')
              .select('id, name, price, image_url, category_id, stock_quantity, user_id')
              .eq('user_id', branding.user_id)
              .gt('stock_quantity', 0)
              .order('created_at', { ascending: false })
              .limit(100)
            
            const { data: catData } = await supabase.from('categories')
              .select('id, name')
              .eq('user_id', branding.user_id)
              .order('name')

            setData({
              branding,
              products: products || [],
              categories: catData || []
            })
          }
        } catch (err) {
          console.error('Erro ao carregar catálogo:', err)
        }
      }
      setLoading(false)
    }
    checkAuthAndLoad()
  }, [loja, catalogo, supabase, router])

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  return (
    <CatalogClient 
      initialBranding={data.branding} 
      initialProducts={data.products} 
      initialCategories={data.categories}
    />
  )
}
