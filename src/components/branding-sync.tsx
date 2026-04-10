'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BrandingSync() {
  const supabase = createClient()

  useEffect(() => {
    async function syncBranding() {
      const { data } = await supabase.from('branding').select('*').single()
      if (data) {
        const { primary_color, secondary_color, business_name, instagram } = data
        
        // Aplica cores no CSS Global
        if (primary_color) document.documentElement.style.setProperty('--brand-primary', primary_color)
        if (secondary_color) document.documentElement.style.setProperty('--brand-secondary', secondary_color)
        
        // Atualiza o Título da Aba do Navegador
        const finalName = business_name || instagram || 'LAPIDADO'
        document.title = `${finalName} — Catálogo de Semijoias`
      }
    }
    syncBranding()
  }, [])

  return null
}
