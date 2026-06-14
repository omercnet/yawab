import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  directionOf,
  isSupportedLanguage,
  resolveLanguage,
  resolvePreference
} from './locales'

describe('isSupportedLanguage', () => {
  it('accepts supported codes', () => {
    for (const { code } of SUPPORTED_LANGUAGES) {
      expect(isSupportedLanguage(code)).toBe(true)
    }
  })

  it('rejects unsupported or empty values', () => {
    expect(isSupportedLanguage('fr')).toBe(false)
    expect(isSupportedLanguage('')).toBe(false)
    expect(isSupportedLanguage(null)).toBe(false)
    expect(isSupportedLanguage(undefined)).toBe(false)
  })
})

describe('resolveLanguage', () => {
  it('extracts the primary subtag from a BCP-47 locale', () => {
    expect(resolveLanguage('he-IL')).toBe('he')
    expect(resolveLanguage('ar_EG')).toBe('ar')
    expect(resolveLanguage('en-US')).toBe('en')
    expect(resolveLanguage('ES')).toBe('es')
  })

  it('falls back to the default for unsupported or missing locales', () => {
    expect(resolveLanguage('fr-FR')).toBe(DEFAULT_LANGUAGE)
    expect(resolveLanguage('')).toBe(DEFAULT_LANGUAGE)
    expect(resolveLanguage(null)).toBe(DEFAULT_LANGUAGE)
    expect(resolveLanguage(undefined)).toBe(DEFAULT_LANGUAGE)
  })
})

describe('resolvePreference', () => {
  it('honours an explicit supported preference', () => {
    expect(resolvePreference('ru', 'he-IL')).toBe('ru')
  })

  it('follows the system locale when preference is "system"', () => {
    expect(resolvePreference('system', 'ar-SA')).toBe('ar')
  })

  it('follows the system locale when preference is invalid', () => {
    expect(resolvePreference('fr', 'es-MX')).toBe('es')
    expect(resolvePreference(null, 'he-IL')).toBe('he')
  })

  it('falls back to the default when nothing resolves', () => {
    expect(resolvePreference('system', 'fr-FR')).toBe(DEFAULT_LANGUAGE)
  })
})

describe('directionOf', () => {
  it('returns rtl for Hebrew and Arabic', () => {
    expect(directionOf('he')).toBe('rtl')
    expect(directionOf('ar')).toBe('rtl')
  })

  it('returns ltr for LTR languages and unknown input', () => {
    expect(directionOf('en')).toBe('ltr')
    expect(directionOf('ru')).toBe('ltr')
    expect(directionOf('es')).toBe('ltr')
    expect(directionOf('zz')).toBe('ltr')
    expect(directionOf(null)).toBe('ltr')
  })
})
