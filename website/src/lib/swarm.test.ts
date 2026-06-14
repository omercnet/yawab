import { describe, expect, test } from 'vitest'
import { createSprite, type Sprite, shouldAnimate, stepSprite } from './swarm'

const bounds = { w: 1200, h: 800 }
const fixed = (v: number) => () => v

describe('createSprite', () => {
  test('places the sprite below the viewport, drifting upward', () => {
    const s = createSprite(3, bounds, fixed(0.5))
    expect(s.index).toBe(3)
    expect(s.depth).toBeGreaterThanOrEqual(0.4)
    expect(s.depth).toBeLessThanOrEqual(1)
    expect(s.vy).toBeLessThan(0)
    expect(s.x).toBe(s.baseX)
    expect(s.x).toBeGreaterThanOrEqual(0)
    expect(s.x).toBeLessThanOrEqual(bounds.w)
    expect(s.y).toBeGreaterThanOrEqual(bounds.h)
  })

  test('uses Math.random by default', () => {
    const s = createSprite(0, bounds)
    expect(s.depth).toBeGreaterThanOrEqual(0.4)
    expect(s.depth).toBeLessThanOrEqual(1)
  })
})

describe('stepSprite', () => {
  test('moves the sprite upward and keeps x within bounds', () => {
    const s = createSprite(0, bounds, fixed(0.5))
    const next = stepSprite(s, 16, bounds, fixed(0.5))
    expect(next.y).toBeLessThan(s.y)
    expect(next.x).toBeGreaterThanOrEqual(0)
    expect(next.x).toBeLessThanOrEqual(bounds.w)
  })

  test('respawns at the bottom once it leaves the top', () => {
    const s: Sprite = {
      baseX: 10,
      x: 10,
      y: -200,
      vy: -100,
      depth: 0.5,
      index: 7,
      sway: 20,
      swaySpeed: 1
    }
    const next = stepSprite(s, 1000, bounds, fixed(0.5))
    expect(next.index).toBe(7)
    expect(next.y).toBeGreaterThanOrEqual(bounds.h)
  })

  test('defaults rng to Math.random on respawn', () => {
    const s: Sprite = {
      baseX: 0,
      x: 0,
      y: -200,
      vy: -100,
      depth: 0.5,
      index: 1,
      sway: 10,
      swaySpeed: 1
    }
    const next = stepSprite(s, 1000, bounds)
    expect(next.y).toBeGreaterThanOrEqual(bounds.h)
  })
})

describe('shouldAnimate', () => {
  test('true only when motion is allowed and the pipeline exists', () => {
    expect(
      shouldAnimate({ reducedMotion: false, hasCanvas: true, hasImageBitmap: true })
    ).toBe(true)
    expect(
      shouldAnimate({ reducedMotion: true, hasCanvas: true, hasImageBitmap: true })
    ).toBe(false)
    expect(
      shouldAnimate({ reducedMotion: false, hasCanvas: false, hasImageBitmap: true })
    ).toBe(false)
    expect(
      shouldAnimate({ reducedMotion: false, hasCanvas: true, hasImageBitmap: false })
    ).toBe(false)
  })
})
