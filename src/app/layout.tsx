import { Metadata } from 'next'
import { Suspense } from 'react'
import RootLayoutContent from './RootLayoutContent'
import { createClient } from '@/lib/supabase/server'
import Script from 'next/script'
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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID

  return (
    <html lang="pt-BR" className="scroll-smooth">
      <head>
        {/* Meta Pixel Code */}
        {metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        
        {/* Google Ads Tag */}
        {googleAdsId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
            />
            <Script id="google-ads" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAdsId}');
              `}
            </Script>
          </>
        )}
      </head>
      <Suspense fallback={<body></body>}>
        <RootLayoutContent>{children}</RootLayoutContent>
      </Suspense>
    </html>
  )
}
