'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BrandingSync() {
  const supabase = createClient()

  useEffect(() => {
    async function syncBranding() {
      const { data } = await supabase.from('branding').select('*').single()
      if (data) {
        const { primary_color, secondary_color, business_name, instagram, custom_domain: fontFamily } = data
        
        // Aplica cores no CSS Global
        if (primary_color) {
          document.documentElement.style.setProperty('--brand-primary', primary_color, 'important');
          document.body.style.setProperty('--brand-primary', primary_color, 'important');
        }
        if (secondary_color) {
          document.documentElement.style.setProperty('--brand-secondary', secondary_color, 'important');
          document.body.style.setProperty('--brand-secondary', secondary_color, 'important');
        }

        // Aplica Fonte Dinâmica (Google Fonts)
        if (fontFamily && fontFamily !== 'Inter') {
          const fontLink = document.getElementById('brand-font-link') as HTMLLinkElement;
          const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;700&display=swap`;
          
          if (fontLink) {
            fontLink.href = fontUrl;
          } else {
            const link = document.createElement('link');
            link.id = 'brand-font-link';
            link.rel = 'stylesheet';
            link.href = fontUrl;
            document.head.appendChild(link);
          }
          document.documentElement.style.setProperty('--brand-font', `"${fontFamily}", sans-serif`, 'important');
          document.body.style.setProperty('--brand-font', `"${fontFamily}", sans-serif`, 'important');
        }
        
        // Atualiza o Título da Aba do Navegador
        const finalName = business_name || instagram || 'LAPIDADO'
        document.title = `${finalName} — Catálogo de Semijoias`
      }
    }
    syncBranding()
  }, [])

  return null
}
