import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { RELEASES_LATEST_URL } from '../lib/downloads'
import { useDownloads } from './useDownloads'

const BASE = 'https://github.com/omercnet/yawab/releases/download/v1.0.3'

const release = {
  tag_name: 'v1.0.3',
  assets: [
    {
      name: 'Yawab-1.0.3-arm64.dmg',
      browser_download_url: `${BASE}/Yawab-1.0.3-arm64.dmg`
    },
    {
      name: 'Yawab-1.0.3-arm64.dmg.blockmap',
      browser_download_url: `${BASE}/Yawab-1.0.3-arm64.dmg.blockmap`
    },
    { name: 'Yawab-1.0.3-x64.dmg', browser_download_url: `${BASE}/Yawab-1.0.3-x64.dmg` },
    {
      name: 'Yawab-1.0.3-setup-x64.exe',
      browser_download_url: `${BASE}/Yawab-1.0.3-setup-x64.exe`
    },
    {
      name: 'Yawab-1.0.3-x86_64.AppImage',
      browser_download_url: `${BASE}/Yawab-1.0.3-x86_64.AppImage`
    },
    {
      name: 'Yawab-1.0.3-amd64.deb',
      browser_download_url: `${BASE}/Yawab-1.0.3-amd64.deb`
    }
  ]
}

const setUserAgent = (value: string) => {
  Object.defineProperty(globalThis.navigator, 'userAgent', {
    value,
    configurable: true
  })
}

describe('useDownloads', () => {
  beforeEach(() => {
    globalThis.sessionStorage?.clear()
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  test('resolves direct latest-release URLs (S1), never a .blockmap (S3)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => release })
    )

    const { result } = renderHook(() => useDownloads())

    await waitFor(() => expect(result.current.version).toBe('v1.0.3'))

    expect(result.current.links['mac-arm64']).toBe(`${BASE}/Yawab-1.0.3-arm64.dmg`)
    expect(result.current.links['mac-x64']).toMatch(/-x64\.dmg$/)
    expect(result.current.links['win-x64']).toMatch(/-setup-x64\.exe$/)
    expect(result.current.links['linux-appimage']).toMatch(/\.AppImage$/)
    expect(result.current.links['linux-deb']).toMatch(/\.deb$/)

    for (const href of Object.values(result.current.links)) {
      expect(href).not.toMatch(/\.blockmap$/)
    }

    expect(result.current.primaryHref).toMatch(
      /\/releases\/download\/v\d+\.\d+\.\d+\/Yawab-.*-(arm64|x64)\.dmg$/
    )
    expect(result.current.primaryLabel).toBe('Download for macOS')
  })

  test('falls back to the releases page when the API fails (S2)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))

    const { result } = renderHook(() => useDownloads())

    await waitFor(() => expect(result.current.primaryHref).toBe(RELEASES_LATEST_URL))

    for (const href of Object.values(result.current.links)) {
      expect(href).toBe(RELEASES_LATEST_URL)
    }
    expect(result.current.version).toBeNull()
  })
})
