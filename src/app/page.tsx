import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '@/lib/utils'
import CatalogClient from './CatalogClient'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic' 

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getInitialData(loja?: string) {
  const supabase = await createClient()
  
  let branding = null
  if (loja) {
    // 💎 NEXUS: Busca por slug exato ou tenta encontrar pelo business_name limpo
    const { data } = await supabase.from('branding')
      .select('*')
      .or(`slug.eq.${loja},business_name.ilike.%${loja}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    branding = data
  }

  // Se for uma vitrine de loja, buscamos os produtos. 
  // Se não houver branding (global), retornamos vazio pois o Home fará o redirect.
  if (!branding && !loja) return { branding: null, products: [], categories: [] }

  // Se tiver branding, busca produtos desse usuário. 
  const query = supabase.from('products')
    .select('id, name, price, image_url, category_id, stock_quantity, user_id')
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false })
    .limit(100)

  if (branding) {
    query.eq('user_id', branding.user_id)
  }

  const { data: products } = await query
  
  let categories: any[] = []
  if (branding) {
    const { data: catData } = await supabase.from('categories').select('id, name').eq('user_id', branding.user_id).order('name')
    categories = catData || []
  }

  return { branding, products: products || [], categories }
}

export async function generateMetadata(
  { searchParams }: Props
): Promise<Metadata> {
  const resolvedSearchParams = (await searchParams) || {}
  const loja = resolvedSearchParams.loja as string
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lapidado.com.br'
  
  if (!loja) {
    return {
      title: 'Lapidado | Login 💎',
      description: 'Acesse seu painel administrativo.'
    }
  }

  const supabase = await createClient()
  let branding = null
  if (loja) {
    const { data } = await supabase.from('branding')
      .select('*')
      .or(`slug.eq.${loja},business_name.ilike.%${loja}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    branding = data
  }

  const storeName = branding?.business_name || branding?.store_name || 'LAPIDADO'
  const tagline = branding?.tagline || 'Mais que acessórios, a sua assinatura de estilo.'
  let logoUrl = branding?.logo_url || '/logo-app.png'
  
  // Garantir que a URL da imagem seja absoluta para o WhatsApp
  if (logoUrl.startsWith('/')) {
    logoUrl = `${baseUrl}${logoUrl}`
  }

  const title = `${storeName} | Vitrine Oficial 💎`

  return {
    metadataBase: new URL(baseUrl),
    title,
    description: tagline,
    openGraph: {
      title,
      description: tagline,
      images: [{
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: storeName,
      }],
      type: 'website',
      siteName: storeName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: tagline,
      images: [logoUrl],
    },
  }
}

export default async function Home({ searchParams }: Props) {
  const resolvedSearchParams = (await searchParams) || {}
  const loja = resolvedSearchParams.loja as string
  const catalogo = resolvedSearchParams.catalogo as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 🚀 REDIRECIONAMENTO INTELIGENTE (Nexus 2.0):
  if (!loja && catalogo !== 'true') {
    // Se está logada, vai direto para o Dashboard. Se não, vai para o Login.
    if (user) {
      redirect('/admin')
    } else {
      redirect('/login')
    }
  }

  const { branding, products, categories } = await getInitialData(loja)

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-secondary" size={40} /></div>}>
      <CatalogClient 
        initialBranding={branding} 
        initialProducts={products} 
        initialCategories={categories}
      />
    </Suspense>
  )
}
