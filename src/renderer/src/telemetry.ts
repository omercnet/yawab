import {
  captureException as captureSentryException,
  init as initSentry
} from '@sentry/electron/renderer'
import {
  createPrivacyTelemetryOptions,
  isTelemetryDsnConfigured
} from '@shared/telemetry'

type RendererTelemetryOptions = NonNullable<Parameters<typeof initSentry>[0]>

const configured = isTelemetryDsnConfigured(__YAWAB_SENTRY_DSN__)
const sentryOptions: RendererTelemetryOptions = {
  ...createPrivacyTelemetryOptions({
    dsn: __YAWAB_SENTRY_DSN__,
    environment: __YAWAB_SENTRY_ENVIRONMENT__,
    release: __YAWAB_SENTRY_RELEASE__,
    safeTags: { process: 'renderer' }
  }),
  defaultIntegrations: false,
  integrations: [],
  sendClientReports: false,
  enableLogs: false,
  enableMetrics: false
}

let initialized = false
let enabled = false
let globalHandlersRegistered = false

export function initTelemetry(settingsTelemetryEnabled: boolean): void {
  setTelemetryEnabled(settingsTelemetryEnabled)
}

export function setTelemetryEnabled(settingsTelemetryEnabled: boolean): void {
  enabled = configured && settingsTelemetryEnabled
  if (enabled) initializeSentry()
}

export function captureException(error: unknown): void {
  if (!configured || !enabled || !initialized) return
  captureSentryException(error)
}

function initializeSentry(): void {
  if (!initialized) {
    initSentry(sentryOptions)
    initialized = true
  }
  registerGlobalErrorHandlers()
}

function registerGlobalErrorHandlers(): void {
  if (globalHandlersRegistered) return
  window.addEventListener('error', (event) => {
    captureException(errorFromErrorEvent(event))
  })
  window.addEventListener('unhandledrejection', (event) => {
    captureException(errorFromRejection(event.reason))
  })
  globalHandlersRegistered = true
}

function errorFromErrorEvent(event: ErrorEvent): Error {
  if (event.error instanceof Error) return event.error
  return new Error('Unhandled renderer error')
}

function errorFromRejection(reason: unknown): Error {
  if (reason instanceof Error) return reason
  return new Error('Unhandled renderer promise rejection')
}
