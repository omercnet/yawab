import { describe, expect, test } from 'vitest'
import { bubbleAt, buildBubbleSvg, MESSAGE_TEMPLATES, SAMPLE_CONTACTS } from './bubbles'

describe('bubble data', () => {
  test('contacts are non-empty strings', () => {
    expect(SAMPLE_CONTACTS.length).toBe(12)
    for (const c of SAMPLE_CONTACTS) {
      expect(typeof c).toBe('string')
      expect(c.length).toBeGreaterThan(0)
    }
  })

  test('every template personalises {{name}}', () => {
    expect(MESSAGE_TEMPLATES.length).toBeGreaterThan(0)
    for (const t of MESSAGE_TEMPLATES) {
      expect(t).toContain('{{name}}')
    }
  })

  test('bubbleAt substitutes the name and leaves no token', () => {
    const b = bubbleAt(0)
    expect(b.name).toBe('Ada')
    expect(b.message).toContain('Ada')
    expect(b.message).not.toContain('{{name}}')
  })

  test('bubbleAt cycles contacts and wraps', () => {
    expect(bubbleAt(0).name).not.toBe(bubbleAt(1).name)
    expect(bubbleAt(12).name).toBe(bubbleAt(0).name)
  })

  test('bubbleAt handles negative indices', () => {
    const b = bubbleAt(-1)
    expect(typeof b.name).toBe('string')
    expect(b.message).not.toContain('{{name}}')
  })

  test('bubbleAt rotates templates across the contact wrap', () => {
    expect(bubbleAt(0).message).not.toBe(bubbleAt(12).message)
  })
})

describe('buildBubbleSvg', () => {
  const opts = { width: 260, height: 96, scale: 2 }

  test('produces a foreignObject SVG with the name and no external refs', () => {
    const svg = buildBubbleSvg({ name: 'Grace', message: 'Hi Grace! 🎉' }, opts)
    expect(svg).toContain('<foreignObject')
    expect(svg).toContain('xmlns="http://www.w3.org/1999/xhtml"')
    expect(svg).toContain('Grace')
    expect(svg).toContain('<strong')
    // no taint sources
    expect(svg).not.toContain('https://')
    expect(svg).not.toContain('@font-face')
    expect(svg).not.toContain('<img')
    expect(svg).not.toContain('url(')
  })

  test('encodes scaled pixel size and logical viewBox', () => {
    const svg = buildBubbleSvg({ name: 'Ada', message: 'Hi Ada' }, opts)
    expect(svg).toContain('width="520"')
    expect(svg).toContain('height="192"')
    expect(svg).toContain('viewBox="0 0 260 96"')
  })

  test('escapes XML-special characters', () => {
    const svg = buildBubbleSvg({ name: 'A&B', message: 'Hi A&B <ok>' }, opts)
    expect(svg).toContain('A&amp;B')
    expect(svg).toContain('&lt;ok&gt;')
    expect(svg).not.toMatch(/Hi A&B <ok>/)
  })
})
