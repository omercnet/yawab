import { useEffect, useRef } from 'react'
import { bubbleAt, buildBubbleSvg } from '../lib/bubbles'
import { rasterizeSvg } from '../lib/rasterize'
import {
  type Bounds,
  createSprite,
  type Sprite,
  shouldAnimate,
  stepSprite
} from '../lib/swarm'
import './MessageSwarm.css'

const VARIANTS = 12
const SPRITE_COUNT = 38
const TILE_W = 260
const TILE_H = 96

/**
 * Decorative hero background: real CSS chat bubbles rasterised into a canvas and
 * animated as a gentle, personalised "delivery stream". Pure progressive
 * enhancement — it draws nothing under prefers-reduced-motion or where the
 * canvas/ImageBitmap pipeline is missing, leaving the hero exactly as it was.
 */
export default function MessageSwarm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    const env = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      hasCanvas: ctx !== null,
      hasImageBitmap: typeof createImageBitmap !== 'undefined'
    }
    if (ctx === null || !shouldAnimate(env)) {
      return
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let cancelled = false
    let raf = 0
    let bitmaps: ImageBitmap[] = []
    let sprites: Sprite[] = []
    let bounds: Bounds = { w: 0, h: 0 }
    let last = 0
    let hidden = false
    let offscreen = false

    const measure = () => {
      const rect = canvas.getBoundingClientRect()
      bounds = { w: rect.width || 1, h: rect.height || 1 }
      canvas.width = Math.round(bounds.w * dpr)
      canvas.height = Math.round(bounds.h * dpr)
    }

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw)
      if (hidden || offscreen) {
        last = time
        return
      }
      const dt = last === 0 ? 16 : Math.min(time - last, 80)
      last = time
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, bounds.w, bounds.h)
      const ordered = [...sprites].sort((a, b) => a.depth - b.depth)
      for (const s of ordered) {
        const bmp = bitmaps[s.index % bitmaps.length]
        if (!bmp) {
          continue
        }
        const scale = 0.5 + s.depth * 0.45
        const w = TILE_W * scale
        const h = TILE_H * scale
        const edge = Math.min(
          1,
          Math.max(0, (s.y + h) / 180),
          Math.max(0, (bounds.h - s.y) / 180)
        )
        ctx.globalAlpha = Math.max(0, Math.min(0.5, (0.14 + s.depth * 0.3) * edge))
        ctx.drawImage(bmp, s.x - w / 2, s.y - h / 2, w, h)
      }
      ctx.globalAlpha = 1
      sprites = sprites.map((s) => stepSprite(s, dt, bounds))
    }

    measure()

    const start = async () => {
      const baked = await Promise.all(
        Array.from({ length: VARIANTS }, (_, i) =>
          rasterizeSvg(
            buildBubbleSvg(bubbleAt(i), { width: TILE_W, height: TILE_H, scale: dpr }),
            TILE_W * dpr,
            TILE_H * dpr
          )
        )
      )
      if (cancelled) {
        for (const b of baked) {
          b?.close()
        }
        return
      }
      bitmaps = baked.filter((b): b is ImageBitmap => b !== null)
      if (bitmaps.length === 0) {
        return
      }
      const count = bounds.w < 640 ? 22 : SPRITE_COUNT
      sprites = Array.from({ length: count }, (_, i) => createSprite(i, bounds))
      raf = requestAnimationFrame(draw)
    }
    void start()

    const resizeObserver = new ResizeObserver(() => measure())
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        offscreen = !entry.isIntersecting
      }
    })
    intersectionObserver.observe(canvas)
    const onVisibility = () => {
      hidden = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      for (const b of bitmaps) {
        b.close()
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="message-swarm" />
}
