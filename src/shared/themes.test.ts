import { describe, expect, it } from 'vitest'
import {
  CSS_VAR_BY_TOKEN,
  DEFAULT_DARK_THEME_ID,
  DEFAULT_LIGHT_THEME_ID,
  getTheme,
  resolveTheme,
  THEMES,
  type ThemeTokens
} from './themes'

const TOKEN_KEYS = Object.keys(CSS_VAR_BY_TOKEN) as Array<keyof ThemeTokens>
const HEX = /^#[0-9a-fA-F]{6}$/

describe('THEMES', () => {
  it('ships a healthy library of famous palettes', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(15)
  })

  it('has unique ids', () => {
    const ids = THEMES.map((theme) => theme.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('defines every token as a valid hex color for each theme', () => {
    for (const theme of THEMES) {
      for (const key of TOKEN_KEYS) {
        expect(theme.tokens[key], `${theme.id}.${key}`).toMatch(HEX)
      }
    }
  })

  it('includes the default dark and light themes', () => {
    expect(getTheme(DEFAULT_DARK_THEME_ID)?.isDark).toBe(true)
    expect(getTheme(DEFAULT_LIGHT_THEME_ID)?.isDark).toBe(false)
  })
})

describe('getTheme', () => {
  it('returns a known theme and undefined for an unknown id', () => {
    expect(getTheme('dracula')?.name).toBe('Dracula')
    expect(getTheme('does-not-exist')).toBeUndefined()
  })
})

describe('resolveTheme', () => {
  it('follows the OS scheme for the "system" preference', () => {
    expect(resolveTheme('system', true).id).toBe(DEFAULT_DARK_THEME_ID)
    expect(resolveTheme('system', false).id).toBe(DEFAULT_LIGHT_THEME_ID)
  })

  it('returns the requested theme when it exists', () => {
    expect(resolveTheme('nord').id).toBe('nord')
  })

  it('falls back to the default dark theme for an unknown id', () => {
    expect(resolveTheme('bogus').id).toBe(DEFAULT_DARK_THEME_ID)
  })
})
