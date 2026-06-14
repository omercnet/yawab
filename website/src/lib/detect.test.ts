import { describe, expect, it } from 'vitest'
import { detectPlatform } from './detect'

describe('detectPlatform', () => {
  it('detects mac arm64 from user agent and UA architecture hints', () => {
    expect(
      detectPlatform({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        uaArch: 'arm'
      })
    ).toEqual({ os: 'mac', arch: 'arm64' })
  })

  it('detects Windows as x64 by default', () => {
    expect(
      detectPlatform({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      })
    ).toEqual({ os: 'win', arch: 'x64' })
  })

  it('detects Linux and X11 as linux x64', () => {
    expect(detectPlatform({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toEqual({
      os: 'linux',
      arch: 'x64'
    })
  })

  it('defaults empty hints to unknown x64', () => {
    expect(detectPlatform({})).toEqual({ os: 'unknown', arch: 'x64' })
  })

  it('falls back to arm64 for Apple touch devices or arm user agents', () => {
    expect(
      detectPlatform({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Touch'
      })
    ).toEqual({ os: 'mac', arch: 'arm64' })
    expect(detectPlatform({ userAgent: 'Mozilla/5.0 (Linux; arm64)' })).toEqual({
      os: 'linux',
      arch: 'arm64'
    })
  })

  it('uses explicit arm64 architecture hint and treats other hints as x64', () => {
    expect(detectPlatform({ userAgent: 'Linux', uaArch: 'arm64' })).toEqual({
      os: 'linux',
      arch: 'arm64'
    })
    expect(detectPlatform({ userAgent: 'Linux arm64', uaArch: 'x86' })).toEqual({
      os: 'linux',
      arch: 'x64'
    })
  })
})
