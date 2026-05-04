import { Metadata, ResolvingMetadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CatalogClient from './CatalogClient'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const loja = resolvedSearchParams.loja as string
  
  const supabase = await createClient()
  
  let branding = null
  if (loja) {
    const { data } = await supabase.from('branding').select('*').eq('slug', loja).maybeSingle()
    branding = data
  }

  const storeName = branding?.business_name || branding?.store_name || 'LAPIDADO'
  const tagline = branding?.tagline || 'Mais que acessórios, a sua assinatura de estilo.'
  const logoUrl = branding?.logo_url || '/logo-app.png'

  return {
    title: `${storeName} | Vitrine Oficial 💎`,
    description: tagline,
    openGraph: {
      title: `${storeName} | Vitrine Oficial 💎`,
      description: tagline,
      images: [logoUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${storeName} | Vitrine Oficial 💎`,
      description: tagline,
      images: [logoUrl],
    },
  }
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
      <CatalogClient />
    </Suspense>
  )
}
