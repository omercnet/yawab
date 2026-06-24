import type {
  Breadcrumb,
  BreadcrumbHint,
  ErrorEvent,
  EventHint,
  Exception,
  StackFrame
} from '@sentry/electron/renderer'

const REDACTED = '[redacted]'

const PHONE_PATTERN = /\+?\d[\d ().-]{7,}\d/g
const SESSION_TOKEN_PATTERN =
  /\b(?:wa|whatsapp|session|token|auth|creds)[-_A-Za-z0-9]{6,}\b/gi
const LINUX_HOME_PATH_PATTERN = /\/home\/[^/\s)'"`]+(?:\/[^\s)'"`]*)*/g
const MAC_HOME_PATH_PATTERN = /\/Users\/[^/\s)'"`]+(?:\/[^\s)'"`]*)*/g
const WINDOWS_USER_PATH_PATTERN = /[A-Za-z]:\\Users\\[^\\\s)'"`]+(?:\\[^\s)'"`]*)*/g

export type SafeTagValue = string | number | boolean

export interface TelemetrySanitizerConfig {
  readonly safeTags?: Readonly<Record<string, SafeTagValue>>
}

export interface TelemetryPrivacyConfig extends TelemetrySanitizerConfig {
  readonly dsn?: string
  readonly environment?: string
  readonly release?: string
}

export interface TelemetryPrivacyOptions {
  readonly dsn?: string
  readonly environment?: string
  readonly release?: string
  readonly sendDefaultPii: false
  readonly maxBreadcrumbs: 0
  readonly beforeSend: (event: ErrorEvent, hint: EventHint) => ErrorEvent | null
  readonly beforeBreadcrumb: (
    breadcrumb: Breadcrumb,
    hint?: BreadcrumbHint
  ) => Breadcrumb | null
}

export function isTelemetryDsnConfigured(dsn: string | null | undefined): boolean {
  return cleanOptionalString(dsn) !== undefined
}

export function createPrivacyTelemetryOptions(
  config: TelemetryPrivacyConfig = {}
): TelemetryPrivacyOptions {
  const dsn = cleanOptionalString(config.dsn)
  const environment = cleanOptionalString(config.environment)
  const release = cleanOptionalString(config.release)

  return {
    ...(dsn === undefined ? {} : { dsn }),
    ...(environment === undefined ? {} : { environment }),
    ...(release === undefined ? {} : { release }),
    sendDefaultPii: false,
    maxBreadcrumbs: 0,
    beforeSend: createBeforeSend({ safeTags: config.safeTags }),
    beforeBreadcrumb: dropTelemetryBreadcrumb
  }
}

export function createBeforeSend(
  config: TelemetrySanitizerConfig = {}
): (event: ErrorEvent, hint: EventHint) => ErrorEvent | null {
  return (event, _hint) => sanitizeSentryEvent(event, config)
}

export function dropTelemetryBreadcrumb(
  _breadcrumb: Breadcrumb,
  _hint?: BreadcrumbHint
): null {
  return null
}

export function sanitizeSentryEvent(
  event: ErrorEvent,
  config: TelemetrySanitizerConfig = {}
): ErrorEvent {
  const sanitized: ErrorEvent = { type: undefined }
  const exception = sanitizeExceptionPayload(event.exception)
  const safeTags = sanitizeSafeTags(config.safeTags)

  if (event.event_id !== undefined) sanitized.event_id = event.event_id
  if (event.timestamp !== undefined) sanitized.timestamp = event.timestamp
  if (event.level !== undefined) sanitized.level = event.level
  if (event.platform !== undefined)
    sanitized.platform = redactSensitiveText(event.platform)
  if (event.release !== undefined) sanitized.release = redactSensitiveText(event.release)
  if (event.environment !== undefined) {
    sanitized.environment = redactSensitiveText(event.environment)
  }
  if (event.sdk !== undefined) sanitized.sdk = event.sdk
  if (exception !== undefined) sanitized.exception = exception
  if (safeTags !== undefined) sanitized.tags = safeTags

  return sanitized
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(WINDOWS_USER_PATH_PATTERN, `C:\\Users\\${REDACTED}`)
    .replace(LINUX_HOME_PATH_PATTERN, `/home/${REDACTED}`)
    .replace(MAC_HOME_PATH_PATTERN, `/Users/${REDACTED}`)
    .replace(SESSION_TOKEN_PATTERN, REDACTED)
    .replace(PHONE_PATTERN, REDACTED)
}

function sanitizeExceptionPayload(
  exception: ErrorEvent['exception']
): ErrorEvent['exception'] | undefined {
  const values = exception?.values?.map(sanitizeException)
  return values === undefined ? undefined : { values }
}

function sanitizeException(exception: Exception): Exception {
  const sanitized: Exception = {}
  const frames = exception.stacktrace?.frames?.map(sanitizeStackFrame)

  if (exception.type !== undefined) sanitized.type = redactSensitiveText(exception.type)
  if (exception.value !== undefined) sanitized.value = REDACTED
  if (frames !== undefined) sanitized.stacktrace = { frames }

  return sanitized
}

function sanitizeStackFrame(frame: StackFrame): StackFrame {
  const sanitized: StackFrame = {}

  if (frame.filename !== undefined) {
    sanitized.filename = redactSensitiveText(frame.filename)
  }
  if (frame.function !== undefined) {
    sanitized.function = redactSensitiveText(frame.function)
  }
  if (frame.module !== undefined) sanitized.module = redactSensitiveText(frame.module)
  if (frame.platform !== undefined)
    sanitized.platform = redactSensitiveText(frame.platform)
  if (frame.lineno !== undefined) sanitized.lineno = frame.lineno
  if (frame.colno !== undefined) sanitized.colno = frame.colno
  if (frame.abs_path !== undefined)
    sanitized.abs_path = redactSensitiveText(frame.abs_path)
  if (frame.in_app !== undefined) sanitized.in_app = frame.in_app
  if (frame.instruction_addr !== undefined) {
    sanitized.instruction_addr = redactSensitiveText(frame.instruction_addr)
  }
  if (frame.addr_mode !== undefined)
    sanitized.addr_mode = redactSensitiveText(frame.addr_mode)
  if (frame.debug_id !== undefined) sanitized.debug_id = frame.debug_id

  return sanitized
}

function sanitizeSafeTags(
  safeTags: Readonly<Record<string, SafeTagValue>> | undefined
): Record<string, SafeTagValue> | undefined {
  if (safeTags === undefined) return undefined

  const sanitized: Record<string, SafeTagValue> = {}
  for (const [key, value] of Object.entries(safeTags)) {
    const sanitizedKey = redactSensitiveText(key).trim()
    if (sanitizedKey.length > 0) {
      sanitized[sanitizedKey] =
        typeof value === 'string' ? redactSensitiveText(value) : value
    }
  }

  return Object.keys(sanitized).length === 0 ? undefined : sanitized
}

function cleanOptionalString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed
}
