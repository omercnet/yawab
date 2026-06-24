import type { ErrorEvent } from '@sentry/electron/renderer'
import { describe, expect, it } from 'vitest'
import {
  createBeforeSend,
  createPrivacyTelemetryOptions,
  dropTelemetryBreadcrumb,
  isTelemetryDsnConfigured,
  sanitizeSentryEvent
} from './telemetry'

const SENTINELS = {
  phone: '+1 (415) 555-2671',
  contactName: 'Ada Lovelace',
  messageBody: 'Your private launch message goes here',
  sessionToken: 'wa-session-token-SECRET-1234567890',
  linuxHomePath: '/home/omer/Secret Contacts.csv',
  windowsUserPath: 'C:\\Users\\Omer\\Secret Contacts.csv'
} as const

describe('telemetry privacy helpers', () => {
  it('detects configured Sentry DSNs when non-empty', () => {
    expect(isTelemetryDsnConfigured(undefined)).toBe(false)
    expect(isTelemetryDsnConfigured('   ')).toBe(false)
    expect(isTelemetryDsnConfigured('https://public@sentry.example/1')).toBe(true)
  })

  it('drops all breadcrumbs before Sentry stores them', () => {
    expect(dropTelemetryBreadcrumb({ message: SENTINELS.messageBody })).toBeNull()
  })

  it('creates privacy options with breadcrumb and event sanitizers', () => {
    const options = createPrivacyTelemetryOptions({
      dsn: ' https://public@example.ingest.sentry.io/1 ',
      environment: 'production',
      release: 'yawab@1.1.0',
      safeTags: { component: 'shared-telemetry' }
    })

    expect(options.dsn).toBe('https://public@example.ingest.sentry.io/1')
    expect(options.environment).toBe('production')
    expect(options.release).toBe('yawab@1.1.0')
    expect(options.sendDefaultPii).toBe(false)
    expect(options.maxBreadcrumbs).toBe(0)
    expect(options.beforeBreadcrumb({ message: SENTINELS.messageBody })).toBeNull()

    const sanitized = options.beforeSend(makeSensitiveEvent(), {})
    expect(sanitized?.tags).toEqual({ component: 'shared-telemetry' })
  })

  it('removes contact, message, phone, session, and path data from events', () => {
    const sanitized = sanitizeSentryEvent(makeSensitiveEvent())
    const serialized = JSON.stringify(sanitized)

    for (const sentinel of Object.values(SENTINELS)) {
      expect(serialized).not.toContain(sentinel)
    }

    expect(sanitized.user).toBeUndefined()
    expect(sanitized.request).toBeUndefined()
    expect(sanitized.contexts).toBeUndefined()
    expect(sanitized.extra).toBeUndefined()
    expect(sanitized.tags).toBeUndefined()
    expect(sanitized.breadcrumbs).toBeUndefined()
    expect(sanitized.message).toBeUndefined()
    expect(sanitized.exception?.values?.[0]?.value).toBe('[redacted]')
  })

  it('exposes a beforeSend sanitizer with the Sentry callback shape', () => {
    const beforeSend = createBeforeSend()
    const sanitized = beforeSend(makeSensitiveEvent(), {})

    expect(JSON.stringify(sanitized)).not.toContain(SENTINELS.sessionToken)
  })

  it('keeps non-identifying event metadata while sanitizing stack frame fields', () => {
    const sanitized = sanitizeSentryEvent({
      type: undefined,
      environment: `production ${SENTINELS.sessionToken}`,
      platform: `javascript ${SENTINELS.phone}`,
      release: `yawab@1.1.0 ${SENTINELS.sessionToken}`,
      sdk: { name: 'sentry.javascript.electron', version: '7.13.0' },
      exception: {
        values: [
          {
            type: `TypeError ${SENTINELS.phone}`,
            stacktrace: {
              frames: [
                {
                  module: `renderer.${SENTINELS.sessionToken}`,
                  platform: `browser ${SENTINELS.phone}`,
                  lineno: 7,
                  colno: 11,
                  in_app: true,
                  instruction_addr: `addr-${SENTINELS.sessionToken}`,
                  addr_mode: `mode-${SENTINELS.phone}`,
                  debug_id: 'debug-symbol-id'
                }
              ]
            }
          }
        ]
      }
    })

    expect(sanitized.environment).toBe('production [redacted]')
    expect(sanitized.platform).toBe('javascript [redacted]')
    expect(sanitized.release).toBe('yawab@1.1.0 [redacted]')
    expect(sanitized.sdk?.name).toBe('sentry.javascript.electron')
    expect(sanitized.exception?.values?.[0]?.type).toBe('TypeError [redacted]')

    const frame = sanitized.exception?.values?.[0]?.stacktrace?.frames?.[0]
    expect(frame?.module).toBe('renderer.[redacted]')
    expect(frame?.platform).toBe('browser [redacted]')
    expect(frame?.lineno).toBe(7)
    expect(frame?.colno).toBe(11)
    expect(frame?.in_app).toBe(true)
    expect(frame?.instruction_addr).toBe('addr-[redacted]')
    expect(frame?.addr_mode).toBe('mode-[redacted]')
    expect(frame?.debug_id).toBe('debug-symbol-id')
  })

  it('redacts sensitive safe tag keys', () => {
    const sanitized = sanitizeSentryEvent(
      { type: undefined },
      { safeTags: { [SENTINELS.sessionToken]: false } }
    )

    expect(sanitized.tags).toEqual({ '[redacted]': false })
  })
})

function makeSensitiveEvent(): ErrorEvent {
  return {
    type: undefined,
    event_id: '0123456789abcdef0123456789abcdef',
    timestamp: 1_700_000_000,
    level: 'error',
    platform: 'javascript',
    message: `${SENTINELS.contactName}: ${SENTINELS.messageBody}`,
    user: {
      id: SENTINELS.phone,
      username: SENTINELS.contactName
    },
    request: {
      url: `file://${SENTINELS.linuxHomePath}`,
      headers: { authorization: SENTINELS.sessionToken }
    },
    contexts: {
      device: { name: SENTINELS.contactName },
      session: { token: SENTINELS.sessionToken }
    },
    extra: {
      phone: SENTINELS.phone,
      csvPath: SENTINELS.windowsUserPath,
      message: SENTINELS.messageBody
    },
    tags: {
      phone: SENTINELS.phone,
      session: SENTINELS.sessionToken
    },
    breadcrumbs: [
      {
        message: SENTINELS.messageBody,
        data: { phone: SENTINELS.phone }
      }
    ],
    exception: {
      values: [
        {
          type: 'Error',
          value: `${SENTINELS.contactName} ${SENTINELS.messageBody} ${SENTINELS.phone}`,
          stacktrace: {
            frames: [
              {
                filename: SENTINELS.linuxHomePath,
                abs_path: SENTINELS.windowsUserPath,
                function: `send ${SENTINELS.sessionToken}`,
                context_line: SENTINELS.messageBody,
                pre_context: [SENTINELS.contactName],
                post_context: [SENTINELS.phone]
              }
            ]
          }
        }
      ]
    }
  }
}
