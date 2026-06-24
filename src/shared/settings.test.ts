import { describe, expect, it } from 'vitest'
import {
  coerceSettings,
  DEFAULT_SETTINGS,
  MIN_DELAY_FLOOR_MS,
  PACING_PRESETS,
  pacingRisk
} from './settings'

describe('coerceSettings', () => {
  it('returns the defaults for empty / nullish input', () => {
    expect(coerceSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(coerceSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(coerceSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it('migrates the legacy language-only shape', () => {
    const next = coerceSettings({ language: 'he' })
    expect(next.language).toBe('he')
    expect(next.schemaVersion).toBe(DEFAULT_SETTINGS.schemaVersion)
    expect(next.pacing).toEqual(DEFAULT_SETTINGS.pacing)
  })

  it('rejects an unsupported language', () => {
    expect(coerceSettings({ language: 'xx' }).language).toBe('system')
  })

  it('keeps a string theme but defaults a non-string one', () => {
    expect(coerceSettings({ theme: 'dracula' }).theme).toBe('dracula')
    expect(coerceSettings({ theme: 42 }).theme).toBe(DEFAULT_SETTINGS.theme)
  })

  it('coerces booleans, falling back when not a boolean', () => {
    expect(coerceSettings({ reduceMotion: true }).reduceMotion).toBe(true)
    expect(coerceSettings({ reduceMotion: 'yes' }).reduceMotion).toBe(false)
    expect(coerceSettings({ autoUpdate: false }).autoUpdate).toBe(false)
    expect(coerceSettings({ telemetryEnabled: false }).telemetryEnabled).toBe(false)
    expect(coerceSettings({ telemetryEnabled: 'nope' }).telemetryEnabled).toBe(true)
  })

  it('clamps the minimum delay up to the safety floor', () => {
    expect(coerceSettings({ pacing: { minDelayMs: 0 } }).pacing.minDelayMs).toBe(
      MIN_DELAY_FLOOR_MS
    )
    expect(coerceSettings({ pacing: { minDelayMs: -5 } }).pacing.minDelayMs).toBe(
      MIN_DELAY_FLOOR_MS
    )
  })

  it('forces maxDelay to be at least minDelay', () => {
    const next = coerceSettings({ pacing: { minDelayMs: 5000, maxDelayMs: 1000 } })
    expect(next.pacing.minDelayMs).toBe(5000)
    expect(next.pacing.maxDelayMs).toBe(5000)
  })

  it('rounds and clamps numeric pacing fields, falling back on non-numbers', () => {
    const next = coerceSettings({
      pacing: { perRunCap: 10.7, batchSize: -3, stopAfterFailures: 'x' }
    })
    expect(next.pacing.perRunCap).toBe(11)
    expect(next.pacing.batchSize).toBe(0)
    expect(next.pacing.stopAfterFailures).toBe(DEFAULT_SETTINGS.pacing.stopAfterFailures)
  })

  it('strips non-digits and caps the country code length', () => {
    expect(
      coerceSettings({ csv: { defaultCountryCode: '+9 7 2' } }).csv.defaultCountryCode
    ).toBe('972')
    expect(
      coerceSettings({ csv: { defaultCountryCode: 12 } }).csv.defaultCountryCode
    ).toBe('')
  })

  it('validates the missing-token strategy', () => {
    expect(
      coerceSettings({ message: { missingToken: 'blank' } }).message.missingToken
    ).toBe('blank')
    expect(
      coerceSettings({ message: { missingToken: 'nope' } }).message.missingToken
    ).toBe('keep')
  })

  it('coerces and truncates the opt-out footer', () => {
    const long = 'a'.repeat(400)
    const next = coerceSettings({
      message: { optOutFooterEnabled: true, optOutFooterText: long }
    })
    expect(next.message.optOutFooterEnabled).toBe(true)
    expect(next.message.optOutFooterText).toHaveLength(280)
    expect(
      coerceSettings({ message: { optOutFooterText: 5 } }).message.optOutFooterText
    ).toBe('')
  })

  it('coerces connection preferences', () => {
    const next = coerceSettings({
      connection: { appearOnline: true, autoReconnect: false }
    })
    expect(next.connection).toEqual({ appearOnline: true, autoReconnect: false })
  })
})

describe('pacingRisk', () => {
  it('flags very fast windows as danger', () => {
    expect(pacingRisk({ minDelayMs: 1000, maxDelayMs: 2000 })).toBe('danger')
    expect(pacingRisk({ minDelayMs: 2000, maxDelayMs: 2500 })).toBe('danger')
  })

  it('flags brisk windows as caution', () => {
    expect(pacingRisk({ minDelayMs: 2000, maxDelayMs: 6000 })).toBe('caution')
  })

  it('treats slow windows as safe', () => {
    expect(pacingRisk({ minDelayMs: 3000, maxDelayMs: 8000 })).toBe('safe')
  })
})

describe('PACING_PRESETS', () => {
  it('are ordered safest-first and within valid bounds', () => {
    expect(PACING_PRESETS.map((p) => p.id)).toEqual(['cautious', 'balanced', 'fast'])
    for (const preset of PACING_PRESETS) {
      expect(preset.minDelayMs).toBeGreaterThanOrEqual(MIN_DELAY_FLOOR_MS)
      expect(preset.maxDelayMs).toBeGreaterThanOrEqual(preset.minDelayMs)
    }
  })
})
