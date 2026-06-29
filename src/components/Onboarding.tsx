'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Sparkles, Coins, MessageCircle, ChevronRight } from 'lucide-react'

// 💎 Tela de boas-vindas mostrada apenas na PRIMEIRA vez que a lojista entra (web ou app).
// Não aparece para clientes (vitrine pública) nem repete depois de vista/pulada.
const STORAGE_KEY = 'lapidado_onboarding_v1'

const SERIF = 'Georgia, "Times New Roman", serif'

type Slide = {
  kind: 'welcome' | 'icon'
  Icon?: typeof Sparkles
  tag: string
  title: string
  text: string
}

const SLIDES: Slide[] = [
  {
    kind: 'welcome',
    tag: 'CATÁLOGO',
    title: 'LAPIDADO',
    text: 'Suas semijoias merecem brilhar como diamantes.',
  },
  {
    kind: 'icon',
    Icon: Sparkles,
    tag: 'MÁGICA LAPIDADO',
    title: 'A foto vira anúncio',
    text: 'Fotografe a peça e a inteligência escreve o nome e a descrição que vendem por você.',
  },
  {
    kind: 'icon',
    Icon: Coins,
    tag: 'PREÇO CERTO',
    title: 'Lucro sob controle',
    text: 'Informe o custo e a margem — o preço de venda aparece na hora, sem calculadora.',
  },
  {
    kind: 'icon',
    Icon: MessageCircle,
    tag: 'SUA VITRINE',
    title: 'Pronta pra brilhar',
    text: 'Um link só seu para enviar no WhatsApp e no Instagram e receber pedidos.',
  },
]

export default function Onboarding() {
  const [show, setShow] = useState(false)
  const [index, setIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 🚫 Visão do cliente (vitrine pública): nunca mostra o onboarding da lojista
    const isCustomer =
      !!searchParams.get('loja') ||
      searchParams.get('catalogo') === 'true' ||
      pathname?.startsWith('/product') === true ||
      pathname?.startsWith('/cart') === true

    // ✅ Pontos de entrada da lojista (primeira tela ao abrir)
    const isEntry = pathname === '/login' || pathname === '/'

    let alreadySeen = false
    try {
      alreadySeen = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      alreadySeen = false
    }

    if (!isCustomer && isEntry && !alreadySeen) {
      setShow(true)
    }
  }, [pathname, searchParams])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* armazenamento indisponível: segue sem travar */
    }
    setShow(false)
  }

  const handleStart = () => {
    dismiss()
    router.push('/register')
  }

  const isLast = index === SLIDES.length - 1

  const handleNext = () => {
    if (isLast) handleStart()
    else setIndex((i) => Math.min(i + 1, SLIDES.length - 1))
  }

  const handlePrev = () => setIndex((i) => Math.max(i - 1, 0))

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta < -45) handleNext()
    else if (delta > 45) handlePrev()
    touchStartX.current = null
  }

  if (!show) return null

  const slide = SLIDES[index]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Boas-vindas ao Lapidado"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: '#efdacf',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        overflow: 'hidden',
      }}
    >
      {/* Círculos decorativos suaves */}
      <div
        aria-hidden
        style={{ position: 'absolute', top: -60, left: -40, width: 200, height: 200, background: '#f6e7df', borderRadius: '50%' }}
      />
      <div
        aria-hidden
        style={{ position: 'absolute', bottom: -70, right: -50, width: 220, height: 220, background: '#f6e7df', borderRadius: '50%' }}
      />

      {/* Botão Pular */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '12px 20px' }}>
        <button
          onClick={dismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a9725f',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 8,
          }}
        >
          Pular
        </button>
      </div>

      {/* Conteúdo central do slide */}
      <div
        key={index}
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          maxWidth: 360,
          padding: '0 32px',
          animation: 'lapFade 0.35s ease',
        }}
      >
        {slide.kind === 'welcome' ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-app.png"
              alt="Lapidado Catálogo"
              style={{ width: 168, height: 168, borderRadius: 36, boxShadow: '0 20px 50px rgba(169,114,95,0.28)', marginBottom: 28 }}
            />
            <p style={{ fontSize: 14, color: '#7a5c54', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{slide.text}</p>
          </>
        ) : (
          <>
            <div
              style={{
                width: 108,
                height: 108,
                borderRadius: '50%',
                background: '#fbf1ea',
                border: '2px solid #e8c9bc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 28,
              }}
            >
              {slide.Icon && <slide.Icon size={46} color="#bd7d6a" strokeWidth={1.4} />}
            </div>
            <p style={{ fontSize: 11, color: '#a9725f', letterSpacing: 3, fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase' }}>
              {slide.tag}
            </p>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, color: '#5a3e36', margin: '0 0 14px', fontWeight: 500 }}>{slide.title}</h2>
            <p style={{ fontSize: 14, color: '#7a5c54', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>{slide.text}</p>
          </>
        )}
      </div>

      {/* Indicadores (pontinhos) */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 7, marginBottom: 22 }}>
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para a tela ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: i === index ? 22 : 7,
              height: 7,
              borderRadius: 9,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === index ? '#a9725f' : '#dcbcae',
              transition: 'width 0.25s ease, background 0.25s ease',
            }}
          />
        ))}
      </div>

      {/* Botão principal */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360, padding: '0 32px 20px' }}>
        <button
          onClick={handleNext}
          style={{
            width: '100%',
            background: '#a9725f',
            color: '#fff7f2',
            border: 'none',
            borderRadius: 20,
            padding: '17px 0',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 14px 32px rgba(169,114,95,0.3)',
          }}
        >
          {isLast ? 'Começar agora' : 'Avançar'}
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      </div>

      <style>{`@keyframes lapFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  )
}
