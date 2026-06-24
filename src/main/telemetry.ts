import {
  captureException as captureSentryException,
  type ElectronMainOptions,
  init as initSentry
} from '@sentry/electron/main'
import {
  createPrivacyTelemetryOptions,
  isTelemetryDsnConfigured
} from '@shared/telemetry'

const configured = isTelemetryDsnConfigured(__YAWAB_SENTRY_DSN__)
const sentryOptions: ElectronMainOptions = {
  ...createPrivacyTelemetryOptions({
    dsn: __YAWAB_SENTRY_DSN__,
    environment: __YAWAB_SENTRY_ENVIRONMENT__,
    release: __YAWAB_SENTRY_RELEASE__,
    safeTags: { process: 'main' }
  }),
  defaultIntegrations: false,
  integrations: [],
  includeServerName: false,
  attachScreenshot: false,
  sendClientReports: false,
  enableLogs: false,
  enableMetrics: false
}

let initialized = false
let enabled = false
let processHandlersRegistered = false

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
  if (initialized) return
  initSentry(sentryOptions)
  initialized = true
  registerProcessErrorHandlers()
}

function registerProcessErrorHandlers(): void {
  if (processHandlersRegistered) return
  process.on('uncaughtExceptionMonitor', (error) => {
    captureException(error)
  })
  process.on('unhandledRejection', (reason) => {
    captureException(errorFromRejection(reason))
  })
  processHandlersRegistered = true
}

function errorFromRejection(reason: unknown): Error {
  if (reason instanceof Error) return reason
  return new Error('Unhandled main process promise rejection')
}
