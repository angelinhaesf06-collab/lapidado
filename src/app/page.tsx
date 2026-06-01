import { createClient } from '@/lib/supabase/server'
import CatalogClient from './CatalogClient'
import { Metadata } from 'next'

// 💎 NEXUS: Garante que a vitrine sempre mostre os produtos mais recentes sem cache de servidor.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ loja?: string; catalogo?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const loja = params.loja

  if (!loja) {
    return {
      title: 'Lapidado | Catálogo Digital',
      description: 'Seu catálogo de semijoias personalizado.',
    }
  }

  const supabase = await createClient()
  const { data: branding } = await supabase
    .from('branding')
    .select('store_name, tagline, logo_url')
    .eq('slug', loja)
    .maybeSingle()

  if (!branding) {
    return {
      title: 'Lapidado | Catálogo Digital',
    }
  }

  const title = `${branding.store_name} | Catálogo`
  const description = branding.tagline || 'Confira nossas peças exclusivas.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: branding.logo_url ? [{ url: branding.logo_url }] : ['/logo-app.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: branding.logo_url ? [branding.logo_url] : ['/logo-app.png'],
    }
  }
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const loja = params.loja
  const catalogo = params.catalogo
  
  const supabase = await createClient()

  // Se não houver loja nem flag de catálogo, redireciona para login/admin
  // No Next.js 15+ App Router, usamos redirect para SSR
  if (!loja && catalogo !== 'true') {
    const { data: { user } } = await supabase.auth.getUser()
    const { redirect } = require('next/navigation')
    if (user) {
      redirect('/admin')
    } else {
      redirect('/login')
    }
  }

  let branding = null
  let products: any[] = []
  let categories: any[] = []

  if (loja) {
    const { data: bData } = await supabase.from('branding')
      .select('*')
      .eq('slug', loja)
      .maybeSingle()

    branding = bData

    if (branding) {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products')
          .select('id, name, price, image_url, category_id') // ⚡ QUERY ENXUTA: Apenas o essencial para o card
          .eq('user_id', branding.user_id)
          .gt('stock_quantity', 0)
          .order('created_at', { ascending: false })
          .limit(20), // ⚡ BLOCOS PEQUENOS: Carregamento inicial rápido
        supabase.from('categories')
          .select('id, name')
          .eq('user_id', branding.user_id)
          .order('name')
      ])
      
      products = prodRes.data || []
      categories = catRes.data || []
    }
  }

  return (
    <CatalogClient 
      initialBranding={branding} 
      initialProducts={products} 
      initialCategories={categories}
    />
  )
}
