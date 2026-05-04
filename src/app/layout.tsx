import { Metadata } from 'next'
import { Suspense } from 'react'
import RootLayoutContent from './RootLayoutContent'
import { createClient } from '@/lib/supabase/server'
import "./globals.css"

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams || {}
  const loja = (resolvedSearchParams.loja as string) || null
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lapidado.vercel.app'
  
  const supabase = await createClient()
  
  let branding = null
  if (loja) {
    const { data } = await supabase.from('branding').select('*').eq('slug', loja).maybeSingle()
    branding = data
  }

  const storeName = branding?.business_name || branding?.store_name || 'Lapidado'
  const logoUrl = branding?.logo_url || '/logo-app.png'
  const absoluteLogoUrl = logoUrl.startsWith('/') ? `${baseUrl}${logoUrl}` : logoUrl

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${storeName}`,
      default: `${storeName} | Catálogo Digital`,
    },
    description: branding?.tagline || 'Seu catálogo de semijoias personalizado.',
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: storeName,
    },
    icons: {
      apple: absoluteLogoUrl,
      icon: absoluteLogoUrl,
    },
  }
}

export const viewport = {
  themeColor: '#4A322E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <Suspense fallback={<body></body>}>
        <RootLayoutContent>{children}</RootLayoutContent>
      </Suspense>
    </html>
  )
}
