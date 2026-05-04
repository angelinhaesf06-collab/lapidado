import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductClient from './ProductClient'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const id = resolvedSearchParams.id as string
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lapidado.vercel.app'
  
  if (!id) return { title: 'Produto não encontrado | Lapidado' }

  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) return { title: 'Produto não encontrado | Lapidado' }

  const { data: branding } = await supabase
    .from('branding')
    .select('*')
    .eq('user_id', product.user_id)
    .single()

  const storeName = branding?.business_name || branding?.store_name || 'LAPIDADO'
  const title = `${product.name} | ${storeName} ✨`
  const description = product.description?.split('---')[0] || `Confira este(a) ${product.name} no nosso catálogo digital.`
  let imageUrl = product.image_url || '/logo-app.png'

  // Garantir que a URL da imagem seja absoluta para o WhatsApp
  if (imageUrl.startsWith('/')) {
    imageUrl = `${baseUrl}${imageUrl}`
  }

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: product.name,
      }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
      <ProductClient />
    </Suspense>
  )
}
