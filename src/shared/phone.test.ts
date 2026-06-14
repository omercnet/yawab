import { describe, expect, it } from 'vitest'
import { normalizePhone, phoneToJid, toJid } from './phone'

describe('normalizePhone', () => {
  it('strips formatting and the leading +', () => {
    expect(normalizePhone('+1 (415) 555-2671')).toBe('14155552671')
  })

  it('handles 00 international prefix', () => {
    expect(normalizePhone('0044 7911 123456')).toBe('447911123456')
  })

  it('keeps already-bare international numbers', () => {
    expect(normalizePhone('972541234567')).toBe('972541234567')
  })

  it('returns null for empty or junk input', () => {
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone('   ')).toBeNull()
    expect(normalizePhone('not a phone')).toBeNull()
  })

  it('rejects too-short and too-long numbers', () => {
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('1234567890123456789')).toBeNull()
  })

  it('applies a default country code to national numbers', () => {
    expect(normalizePhone('0541234567', { defaultCountryCode: '972' })).toBe(
      '972541234567'
    )
  })

  it('drops a single national trunk zero before prepending the country code', () => {
    expect(normalizePhone('07911123456', { defaultCountryCode: '44' })).toBe(
      '447911123456'
    )
  })

  it('does not double-apply a country code that is already present', () => {
    expect(normalizePhone('972541234567', { defaultCountryCode: '972' })).toBe(
      '972541234567'
    )
  })

  it('tolerates null/undefined safely', () => {
    // @ts-expect-error testing runtime guard
    expect(normalizePhone(null)).toBeNull()
    // @ts-expect-error testing runtime guard
    expect(normalizePhone(undefined)).toBeNull()
  })
})

describe('toJid', () => {
  it('appends the WhatsApp user suffix', () => {
    expect(toJid('14155552671')).toBe('14155552671@s.whatsapp.net')
  })
})

describe('phoneToJid', () => {
  it('normalizes and converts in one step', () => {
    expect(phoneToJid('+1 415-555-2671')).toBe('14155552671@s.whatsapp.net')
  })

  it('returns null for invalid numbers', () => {
    expect(phoneToJid('nope')).toBeNull()
  })
})
