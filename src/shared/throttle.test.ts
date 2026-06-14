import { describe, expect, it, vi } from 'vitest'
import { nextDelay, sleep } from './throttle'

describe('nextDelay', () => {
  it('returns a value within [min, max]', () => {
    const opts = { minDelayMs: 1000, maxDelayMs: 5000 }
    for (let i = 0; i < 100; i++) {
      const delay = nextDelay(opts)
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(5000)
    }
  })

  it('is deterministic with an injected rng', () => {
    expect(nextDelay({ minDelayMs: 1000, maxDelayMs: 5000 }, () => 0)).toBe(1000)
    expect(nextDelay({ minDelayMs: 1000, maxDelayMs: 5000 }, () => 0.5)).toBe(3000)
    expect(nextDelay({ minDelayMs: 1000, maxDelayMs: 5000 }, () => 0.999999)).toBe(5000)
  })

  it('returns the min when min equals max', () => {
    expect(nextDelay({ minDelayMs: 2000, maxDelayMs: 2000 })).toBe(2000)
  })

  it('handles inverted min/max gracefully', () => {
    const delay = nextDelay({ minDelayMs: 5000, maxDelayMs: 1000 }, () => 0.5)
    expect(delay).toBeGreaterThanOrEqual(1000)
    expect(delay).toBeLessThanOrEqual(5000)
  })
})

describe('sleep', () => {
  it('resolves after the given time', async () => {
    vi.useFakeTimers()
    const spy = vi.fn()
    const p = sleep(1000).then(spy)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1000)
    await p
    expect(spy).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
