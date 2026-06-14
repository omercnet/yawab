import { beforeEach, describe, expect, it, vi } from 'vitest'
import { releaseFixture } from './__fixtures__/latest-release'
import { fetchLatestDownloads, RELEASES_LATEST_URL, resolveDownloads } from './downloads'

const urlsFrom = (links: ReturnType<typeof resolveDownloads>) => [
  links.mac.arm64,
  links.mac.x64,
  links.win.x64,
  links.win.arm64,
  links.linux.appImage,
  links.linux.deb
]

const expectAllFallback = (links: ReturnType<typeof resolveDownloads>) => {
  expect(links.version).toBeNull()
  expect(urlsFrom(links)).toEqual(Array(6).fill(RELEASES_LATEST_URL))
}

describe('resolveDownloads', () => {
  it('maps latest release assets to direct installer URLs', () => {
    const links = resolveDownloads(releaseFixture)

    expect(links.version).toBe('v1.0.3')
    expect(links.mac.arm64).toBe(
      'https://github.com/omercnet/yawab/releases/download/v1.0.3/Yawab-1.0.3-arm64.dmg'
    )
    expect(links.mac.x64).toMatch(/-x64\.dmg$/)
    expect(links.win.x64).toMatch(/-setup-x64\.exe$/)
    expect(links.win.arm64).toMatch(/-setup-arm64\.exe$/)
    expect(links.linux.appImage).toMatch(/-x86_64\.AppImage$/)
    expect(links.linux.deb).toMatch(/-amd64\.deb$/)
  })

  it('never resolves blockmap or yml update metadata', () => {
    const links = resolveDownloads(releaseFixture)

    for (const url of urlsFrom(links)) {
      expect(url).not.toMatch(/\.blockmap$/)
      expect(url).not.toMatch(/\.ya?ml$/)
    }
  })

  it('falls back for null or empty releases', () => {
    expectAllFallback(resolveDownloads(null))
    expectAllFallback(resolveDownloads({ tag_name: '', assets: [] }))
  })

  it('falls back only for missing slots', () => {
    const links = resolveDownloads({
      tag_name: 'v2.0.0',
      assets: [releaseFixture.assets[0]]
    })

    expect(links.version).toBe('v2.0.0')
    expect(links.mac.arm64).toMatch(/-arm64\.dmg$/)
    expect(links.mac.x64).toBe(RELEASES_LATEST_URL)
    expect(links.win.x64).toBe(RELEASES_LATEST_URL)
    expect(links.win.arm64).toBe(RELEASES_LATEST_URL)
    expect(links.linux.appImage).toBe(RELEASES_LATEST_URL)
    expect(links.linux.deb).toBe(RELEASES_LATEST_URL)
  })
})

describe('fetchLatestDownloads', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('falls back when fetch rejects', async () => {
    const rejectingFetch: typeof fetch = () => Promise.reject(new Error('network'))

    expectAllFallback(await fetchLatestDownloads(rejectingFetch))
  })

  it('falls back for non-2xx responses', async () => {
    const failingFetch: typeof fetch = () =>
      Promise.resolve(new Response('nope', { status: 500 }))

    expectAllFallback(await fetchLatestDownloads(failingFetch))
  })

  it('falls back for bad JSON responses', async () => {
    const badJsonFetch: typeof fetch = () =>
      Promise.resolve(new Response('{', { status: 200 }))

    expectAllFallback(await fetchLatestDownloads(badJsonFetch))
  })

  it('resolves a valid response and reuses session cache', async () => {
    const fetching = vi.fn<typeof fetch>(() =>
      Promise.resolve(
        new Response(JSON.stringify(releaseFixture), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )

    const first = await fetchLatestDownloads(fetching)
    const second = await fetchLatestDownloads(() => {
      throw new Error('cache should avoid fetch')
    })

    expect(fetching).toHaveBeenCalledOnce()
    expect(fetching).toHaveBeenCalledWith(
      'https://api.github.com/repos/omercnet/yawab/releases/latest',
      { headers: { Accept: 'application/vnd.github+json' } }
    )
    expect(first).toEqual(second)
    expect(second.mac.arm64).toMatch(/-arm64\.dmg$/)
    expect(sessionStorage.getItem('yawab:downloads')).toBe(JSON.stringify(first))
  })
})
