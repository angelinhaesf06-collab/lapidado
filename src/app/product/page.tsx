'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductClient from './ProductClient'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function Page() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [branding, setBranding] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const { data: pData } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('id', id)
          .single()

        if (pData) {
          setProduct(pData)
          const { data: bData } = await supabase
            .from('branding')
            .select('*')
            .eq('user_id', pData.user_id)
            .single()
          if (bData) setBranding(bData)
        }
      } catch (err) {
        console.error('Erro ao carregar produto:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, supabase])

  if (loading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-secondary" size={40} />
      </div>
    )
  }

  return <ProductClient initialProduct={product} initialBranding={branding} />
}
