export type OS = 'mac' | 'win' | 'linux' | 'unknown'
export type Arch = 'arm64' | 'x64'

export interface Platform {
  os: OS
  arch: Arch
}

const detectOS = (userAgent: string): OS => {
  if (/Macintosh|Mac OS/i.test(userAgent)) {
    return 'mac'
  }

  if (/Windows/i.test(userAgent)) {
    return 'win'
  }

  if (/Linux|X11/i.test(userAgent)) {
    return 'linux'
  }

  return 'unknown'
}

const detectArch = (userAgent: string, uaArch?: string): Arch => {
  if (uaArch) {
    return /^(arm|arm64)$/i.test(uaArch) ? 'arm64' : 'x64'
  }

  if (/AppleWebKit/i.test(userAgent) && /Touch/i.test(userAgent)) {
    return 'arm64'
  }

  if (/arm/i.test(userAgent)) {
    return 'arm64'
  }

  return 'x64'
}

const getGlobalUserAgent = () => globalThis.navigator?.userAgent ?? ''

export function detectPlatform(hints?: {
  userAgent?: string
  uaArch?: string
}): Platform {
  const userAgent = hints ? (hints.userAgent ?? '') : getGlobalUserAgent()
  const uaArch = hints?.uaArch

  return {
    os: detectOS(userAgent),
    arch: detectArch(userAgent, uaArch)
  }
}
