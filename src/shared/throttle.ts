import type { SendOptions } from './types'

/** Promise-based sleep. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)))
}

/**
 * Compute a randomized delay (in ms) to wait between two messages.
 *
 * Randomization within [minDelayMs, maxDelayMs] spreads out sends to look less
 * automated, which materially reduces the risk of WhatsApp flagging the number.
 *
 * @param rng injectable random source in [0, 1) for deterministic testing.
 */
export function nextDelay(options: SendOptions, rng: () => number = Math.random): number {
  const min = Math.max(0, Math.min(options.minDelayMs, options.maxDelayMs))
  const max = Math.max(options.minDelayMs, options.maxDelayMs)
  if (max <= min) return min
  return Math.round(min + rng() * (max - min))
}
