import { afterEach, describe, expect, test, vi } from 'vitest'
import { rasterizeSvg } from './rasterize'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('rasterizeSvg', () => {
  test('returns null when createImageBitmap is unavailable', async () => {
    vi.stubGlobal('createImageBitmap', undefined)
    expect(await rasterizeSvg(SVG, 100, 40)).toBeNull()
  })

  test('returns null (never throws) when rasterisation fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('boom')))
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:x'),
      revokeObjectURL: vi.fn()
    })
    class FakeImage {
      width = 0
      height = 0
      src = ''
      constructor(w?: number, h?: number) {
        this.width = w ?? 0
        this.height = h ?? 0
      }
      decode() {
        return Promise.resolve()
      }
    }
    vi.stubGlobal('Image', FakeImage)
    expect(await rasterizeSvg(SVG, 100, 40)).toBeNull()
  })

  test('resolves to the bitmap on the happy path and revokes the url', async () => {
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap
    const revoke = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:y'),
      revokeObjectURL: revoke
    })
    class FakeImage {
      src = ''
      constructor(
        public width?: number,
        public height?: number
      ) {}
      decode() {
        return Promise.resolve()
      }
    }
    vi.stubGlobal('Image', FakeImage)

    const result = await rasterizeSvg(SVG, 100, 40)
    expect(result).toBe(bitmap)
    expect(revoke).toHaveBeenCalledWith('blob:y')
  })
})
