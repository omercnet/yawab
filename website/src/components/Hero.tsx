import { useEffect, useRef } from 'react'
import MessageSwarm from './MessageSwarm'
import './Hero.css'

const DOWNLOAD_URL = 'https://github.com/omercnet/yawab/releases/latest'
const GH_URL = 'https://github.com/omercnet/yawab'

interface HeroProps {
  primaryHref?: string
  primaryLabel?: string
}

export default function Hero({
  primaryHref = DOWNLOAD_URL,
  primaryLabel = 'Download free'
}: HeroProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const el = contentRef.current
    if (!el) return

    const handler = () => {
      const progress = Math.min(window.scrollY / window.innerHeight, 1)
      el.style.transform = `translateY(${progress * 64}px) scale(${1 - progress * 0.07})`
      el.style.opacity = String(Math.max(0, 1 - progress * 1.35))
      el.style.filter = `blur(${(progress * 6).toFixed(2)}px)`
    }

    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-mesh" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <MessageSwarm />

      <div className="hero-content" ref={contentRef}>
        <p className="hero-eyebrow">
          <span className="hero-eyebrow-dot" aria-hidden="true" />
          Desktop · WhatsApp · Open Source
        </p>

        <h1 id="hero-heading" className="hero-headline">
          <span className="hero-line1">Message everyone.</span>
          <span className="hero-line2">Personally.</span>
        </h1>

        <p className="hero-sub">
          QR-paired. CSV-powered. Blazingly human. Send personalised messages to your
          entire contact list — without bots, APIs, or phone-number databases.
        </p>

        <div className="hero-ctas">
          <a className="btn-primary" href={primaryHref} target="_blank" rel="noreferrer">
            ↓ {primaryLabel}
          </a>
          <a className="btn-ghost" href={GH_URL} target="_blank" rel="noreferrer">
            View on GitHub ↗
          </a>
        </div>
      </div>

      <a className="hero-scroll-cue" href="#features" aria-label="Scroll to features">
        <span className="scroll-arrow" aria-hidden="true" />
        <span className="sr-only">Scroll to features</span>
      </a>
    </section>
  )
}
