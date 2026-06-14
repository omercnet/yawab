export interface Sprite {
  baseX: number
  x: number
  y: number
  vy: number
  depth: number
  index: number
  sway: number
  swaySpeed: number
}

export interface Bounds {
  w: number
  h: number
}

/**
 * Creates a sprite below the viewport that drifts upward. `depth` (0.4–1) drives
 * parallax: nearer bubbles are larger, brighter and faster.
 */
export function createSprite(
  index: number,
  bounds: Bounds,
  rng: () => number = Math.random
): Sprite {
  const depth = 0.4 + rng() * 0.6
  const baseX = rng() * bounds.w
  return {
    baseX,
    x: baseX,
    y: bounds.h + rng() * bounds.h,
    vy: -(16 + depth * 30),
    depth,
    index,
    sway: 16 + rng() * 26,
    swaySpeed: 0.5 + rng() * 1
  }
}

const RESPAWN_MARGIN = 140

/** Advances a sprite; respawns it at the bottom once it drifts off the top. */
export function stepSprite(
  s: Sprite,
  dtMs: number,
  bounds: Bounds,
  rng: () => number = Math.random
): Sprite {
  const dt = dtMs / 1000
  const y = s.y + s.vy * dt
  if (y < -RESPAWN_MARGIN) {
    return createSprite(s.index, bounds, rng)
  }
  const phase = (bounds.h - y) * 0.01 * s.swaySpeed
  const drift = Math.sin(phase) * s.sway
  const x = Math.max(0, Math.min(bounds.w, s.baseX + drift))
  return { ...s, x, y }
}

/** Animate only when motion is allowed and the canvas pipeline is available. */
export function shouldAnimate(env: {
  reducedMotion: boolean
  hasCanvas: boolean
  hasImageBitmap: boolean
}): boolean {
  return !env.reducedMotion && env.hasCanvas && env.hasImageBitmap
}
