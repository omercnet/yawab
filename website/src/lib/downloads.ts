export const RELEASES_LATEST_URL = 'https://github.com/omercnet/yawab/releases/latest'

const GITHUB_LATEST_RELEASE_URL =
  'https://api.github.com/repos/omercnet/yawab/releases/latest'
const CACHE_KEY = 'yawab:downloads'

export interface ReleaseAsset {
  name: string
  browser_download_url: string
}

export interface GithubRelease {
  tag_name: string
  assets: ReleaseAsset[]
}

export interface DownloadLinks {
  version: string | null
  mac: { arm64: string; x64: string }
  win: { x64: string; arm64: string }
  linux: { appImage: string; deb: string }
}

const fallbackDownloads = (): DownloadLinks => ({
  version: null,
  mac: { arm64: RELEASES_LATEST_URL, x64: RELEASES_LATEST_URL },
  win: { x64: RELEASES_LATEST_URL, arm64: RELEASES_LATEST_URL },
  linux: { appImage: RELEASES_LATEST_URL, deb: RELEASES_LATEST_URL }
})

const isReleaseAsset = (value: unknown): value is ReleaseAsset => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const asset = value as Record<string, unknown>

  return typeof asset.name === 'string' && typeof asset.browser_download_url === 'string'
}

const isGithubRelease = (value: unknown): value is GithubRelease => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const release = value as Record<string, unknown>

  return (
    typeof release.tag_name === 'string' &&
    Array.isArray(release.assets) &&
    release.assets.every(isReleaseAsset)
  )
}

const isDownloadLinks = (value: unknown): value is DownloadLinks => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const links = value as Record<string, unknown>
  const mac = links.mac
  const win = links.win
  const linux = links.linux

  if (
    (typeof links.version !== 'string' && links.version !== null) ||
    typeof mac !== 'object' ||
    mac === null ||
    typeof win !== 'object' ||
    win === null ||
    typeof linux !== 'object' ||
    linux === null
  ) {
    return false
  }

  const macLinks = mac as Record<string, unknown>
  const winLinks = win as Record<string, unknown>
  const linuxLinks = linux as Record<string, unknown>

  return (
    typeof macLinks.arm64 === 'string' &&
    typeof macLinks.x64 === 'string' &&
    typeof winLinks.x64 === 'string' &&
    typeof winLinks.arm64 === 'string' &&
    typeof linuxLinks.appImage === 'string' &&
    typeof linuxLinks.deb === 'string'
  )
}

const getSessionStorage = () => {
  try {
    return globalThis.sessionStorage
  } catch {
    return null
  }
}

const safeAssets = (release: GithubRelease) =>
  release.assets.filter(({ name }) => !/\.(blockmap|ya?ml)$/i.test(name))

const findAssetUrl = (assets: ReleaseAsset[], pattern: RegExp) =>
  assets.find(({ name }) => pattern.test(name))?.browser_download_url ??
  RELEASES_LATEST_URL

export function resolveDownloads(release: GithubRelease | null): DownloadLinks {
  if (!release?.tag_name || release.assets.length === 0) {
    return fallbackDownloads()
  }

  const assets = safeAssets(release)

  return {
    version: release.tag_name,
    mac: {
      arm64: findAssetUrl(assets, /-arm64\.dmg$/i),
      x64: findAssetUrl(assets, /-x64\.dmg$/i)
    },
    win: {
      x64: findAssetUrl(assets, /-setup-x64\.exe$/i),
      arm64: findAssetUrl(assets, /-setup-arm64\.exe$/i)
    },
    linux: {
      appImage: findAssetUrl(assets, /\.AppImage$/i),
      deb: findAssetUrl(assets, /\.deb$/i)
    }
  }
}

/**
 * Reads the last successfully-resolved links from sessionStorage for an instant
 * first paint. The caller MUST still call fetchLatestDownloads() to revalidate —
 * the cache is never authoritative (stale-while-revalidate), so a new release is
 * always picked up on the next render instead of being pinned for the session.
 */
export function readCachedDownloads(): DownloadLinks | null {
  const storage = getSessionStorage()
  const cached = storage?.getItem(CACHE_KEY)

  if (!cached) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(cached)
    return isDownloadLinks(parsed) ? parsed : null
  } catch {
    storage?.removeItem(CACHE_KEY)
    return null
  }
}

export async function fetchLatestDownloads(
  fetchImpl: typeof fetch = fetch
): Promise<DownloadLinks> {
  const storage = getSessionStorage()

  try {
    const response = await fetchImpl(GITHUB_LATEST_RELEASE_URL, {
      headers: { Accept: 'application/vnd.github+json' }
    })

    if (!response.ok) {
      return resolveDownloads(null)
    }

    const json: unknown = await response.json()

    if (!isGithubRelease(json)) {
      return resolveDownloads(null)
    }

    const links = resolveDownloads(json)
    storage?.setItem(CACHE_KEY, JSON.stringify(links))

    return links
  } catch {
    return resolveDownloads(null)
  }
}
