import { createClient } from '@/lib/supabase/server'
import ProductClient from './ProductClient'
import { Metadata } from 'next'

interface PageProps {
  searchParams: Promise<{ id?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const id = params.id

  if (!id) return { title: 'Produto | Lapidado' }

  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name, description, image_url, user_id')
    .eq('id', id)
    .single()

  if (!product) return { title: 'Produto não encontrado' }

  const { data: branding } = await supabase
    .from('branding')
    .select('store_name')
    .eq('user_id', product.user_id)
    .single()

  const title = `${product.name} | ${branding?.store_name || 'Lapidado'}`
  const description = product.description || `Confira este item em nossa loja.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_url ? [{ url: product.image_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image_url ? [product.image_url] : [],
    }
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const id = params.id
  
  const supabase = await createClient()

  if (!id) return <div>Produto não identificado</div>

  const { data: product } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('id', id)
    .single()

  if (!product) return <div>Produto não encontrado</div>

  const { data: branding } = await supabase
    .from('branding')
    .select('*')
    .eq('user_id', product.user_id)
    .single()

  return <ProductClient initialProduct={product} initialBranding={branding} />
}
