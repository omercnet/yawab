import { describe, expect, it } from 'vitest'
import { parseContactsCsv } from './csv'

describe('parseContactsCsv', () => {
  it('parses a simple name/phone CSV', () => {
    const csv = 'name,phone\nAda,+1 415 555 2671\nGrace,+1 415 555 9000'
    const result = parseContactsCsv(csv)
    expect(result.valid).toHaveLength(2)
    expect(result.valid[0]).toMatchObject({ name: 'Ada', phone: '14155552671' })
    expect(result.invalid).toHaveLength(0)
  })

  it('auto-detects alternative phone headers', () => {
    const csv = 'Full Name,Mobile Number\nAda,+14155552671'
    const result = parseContactsCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].phone).toBe('14155552671')
    expect(result.valid[0].name).toBe('Ada')
  })

  it('records rows with missing or invalid phones as invalid', () => {
    const csv = 'name,phone\nAda,\nBob,not-a-number\nGrace,+14155559000'
    const result = parseContactsCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.invalid).toHaveLength(2)
    expect(result.invalid[0].reason).toMatch(/missing/i)
    expect(result.invalid[1].reason).toMatch(/invalid/i)
  })

  it('reports an error when no phone column exists', () => {
    const csv = 'name,email\nAda,ada@example.com'
    const result = parseContactsCsv(csv)
    expect(result.valid).toHaveLength(0)
    expect(result.invalid[0].reason).toMatch(/no phone column/i)
  })

  it('de-duplicates by normalized phone number', () => {
    const csv = 'name,phone\nAda,+1 415 555 2671\nAda Again,14155552671'
    const result = parseContactsCsv(csv)
    expect(result.valid).toHaveLength(1)
    expect(result.invalid.some((i) => /duplicate/i.test(i.reason))).toBe(true)
  })

  it('keeps extra columns as template fields', () => {
    const csv = 'name,phone,company\nAda,+14155552671,Engines'
    const result = parseContactsCsv(csv)
    expect(result.valid[0].fields.company).toBe('Engines')
  })

  it('falls back to the raw phone as name when no name column exists', () => {
    const csv = 'phone\n+14155552671'
    const result = parseContactsCsv(csv)
    expect(result.valid[0].name).toBe('+14155552671')
  })

  it('applies a default country code option', () => {
    const csv = 'name,phone\nAda,0541234567'
    const result = parseContactsCsv(csv, { defaultCountryCode: '972' })
    expect(result.valid[0].phone).toBe('972541234567')
  })

  it('honours an explicit phone column override', () => {
    const csv = 'name,primary,secondary\nAda,bad,+14155552671'
    const result = parseContactsCsv(csv, { phoneColumn: 'secondary' })
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].phone).toBe('14155552671')
  })
})
