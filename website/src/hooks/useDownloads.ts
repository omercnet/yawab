import { useEffect, useState } from 'react'
import { detectPlatform } from '../lib/detect'
import {
  type DownloadLinks,
  fetchLatestDownloads,
  RELEASES_LATEST_URL,
  readCachedDownloads,
  resolveDownloads
} from '../lib/downloads'

export type DownloadSlot =
  | 'mac-arm64'
  | 'mac-x64'
  | 'win-x64'
  | 'win-arm64'
  | 'linux-appimage'
  | 'linux-deb'

export interface ResolvedDownloads {
  version: string | null
  links: Record<DownloadSlot, string>
  primaryHref: string
  primaryLabel: string
}

const toSlots = (links: DownloadLinks): Record<DownloadSlot, string> => ({
  'mac-arm64': links.mac.arm64,
  'mac-x64': links.mac.x64,
  'win-x64': links.win.x64,
  'win-arm64': links.win.arm64,
  'linux-appimage': links.linux.appImage,
  'linux-deb': links.linux.deb
})

const pickPrimary = (slots: Record<DownloadSlot, string>) => {
  const { os, arch } = detectPlatform()

  if (os === 'mac') {
    return {
      href: arch === 'arm64' ? slots['mac-arm64'] : slots['mac-x64'],
      label: 'Download for macOS'
    }
  }

  if (os === 'win') {
    return {
      href: arch === 'arm64' ? slots['win-arm64'] : slots['win-x64'],
      label: 'Download for Windows'
    }
  }

  if (os === 'linux') {
    return { href: slots['linux-appimage'], label: 'Download for Linux' }
  }

  return { href: RELEASES_LATEST_URL, label: 'Download free' }
}

const toResolved = (links: DownloadLinks): ResolvedDownloads => {
  const slots = toSlots(links)
  const primary = pickPrimary(slots)

  return {
    version: links.version,
    links: slots,
    primaryHref: primary.href,
    primaryLabel: primary.label
  }
}

/**
 * Resolves the latest GitHub release into per-platform download URLs at runtime,
 * so the site always points at the newest installers without a redeploy. Starts
 * from the safe all-fallback state, then upgrades to direct asset URLs once the
 * GitHub Releases API responds (a rejected/failed request keeps the fallback).
 */
export function useDownloads(): ResolvedDownloads {
  const [resolved, setResolved] = useState<ResolvedDownloads>(() =>
    toResolved(readCachedDownloads() ?? resolveDownloads(null))
  )

  useEffect(() => {
    let active = true

    fetchLatestDownloads().then((links) => {
      if (active) {
        setResolved(toResolved(links))
      }
    })

    return () => {
      active = false
    }
  }, [])

  return resolved
}
