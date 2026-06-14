import { describe, expect, it } from 'vitest'
import { extractTokens, renderTemplate } from './template'
import type { Contact } from './types'

const contact: Contact = {
  name: 'Ada',
  rawPhone: '+1 415 555 2671',
  phone: '14155552671',
  fields: { Company: 'Analytical Engines', city: 'London' }
}

describe('renderTemplate', () => {
  it('substitutes name and phone tokens', () => {
    expect(renderTemplate('Hi {{name}} ({{phone}})', contact)).toBe(
      'Hi Ada (14155552671)'
    )
  })

  it('is case-insensitive and matches extra CSV fields', () => {
    expect(renderTemplate('{{Name}} at {{company}} in {{CITY}}', contact)).toBe(
      'Ada at Analytical Engines in London'
    )
  })

  it('tolerates surrounding whitespace in tokens', () => {
    expect(renderTemplate('Hi {{  name  }}', contact)).toBe('Hi Ada')
  })

  it('leaves unknown tokens untouched', () => {
    expect(renderTemplate('Hi {{unknown}}', contact)).toBe('Hi {{unknown}}')
  })

  it('falls back to the raw phone when normalized phone is null', () => {
    const c: Contact = { ...contact, phone: null }
    expect(renderTemplate('{{phone}}', c)).toBe('+1 415 555 2671')
  })
})

describe('extractTokens', () => {
  it('returns the unique lowercased tokens used', () => {
    expect(extractTokens('{{name}} {{Name}} {{company}}')).toEqual(['name', 'company'])
  })

  it('returns an empty array when there are no tokens', () => {
    expect(extractTokens('plain text')).toEqual([])
  })
})
