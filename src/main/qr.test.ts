import { describe, expect, it } from 'vitest'
import { renderQrDataUrl } from './qr'

const SVG_DATA_URL_PREFIX = 'data:image/svg+xml;charset=UTF-8,'

describe('renderQrDataUrl', () => {
  it('returns an SVG data URL for the pairing payload', () => {
    const dataUrl = renderQrDataUrl('whatsapp-pairing-payload')

    expect(dataUrl.startsWith(SVG_DATA_URL_PREFIX)).toBe(true)
    const svg = decodeURIComponent(dataUrl.slice(SVG_DATA_URL_PREFIX.length))
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox')
  })
})
