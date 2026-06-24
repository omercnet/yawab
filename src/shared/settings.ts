import { isSupportedLanguage, type LanguagePreference } from './locales'

/**
 * The persisted application settings schema.
 *
 * This module is intentionally free of Electron / Node imports so it can be
 * shared by the main process (which owns persistence) and the renderer (which
 * renders the settings UI and applies preferences live).
 */

/** Bumped whenever the persisted shape changes; drives migration in coercion. */
export const SCHEMA_VERSION = 3

/**
 * Hard lower bound on the minimum inter-message delay. We never allow 0: a
 * zero / near-zero delay is the fastest way to get a number banned, so the UI
 * surfaces this floor and clamps any smaller value up to it.
 */
export const MIN_DELAY_FLOOR_MS = 800

/** How a `{{token}}` with no matching value is rendered. */
export type MissingTokenStrategy = 'keep' | 'blank'

export interface PacingSettings {
  /** Minimum delay between messages (ms). Clamped to {@link MIN_DELAY_FLOOR_MS}. */
  minDelayMs: number
  /** Maximum delay between messages (ms). Always >= minDelayMs. */
  maxDelayMs: number
  /** Stop after sending this many messages in one run. 0 = no cap. */
  perRunCap: number
  /** Take a longer cool-down after every N messages. 0 = no batching. */
  batchSize: number
  /** Cool-down length between batches (ms). */
  batchPauseMs: number
  /** Abort the run after this many consecutive failures. 0 = never. */
  stopAfterFailures: number
  /** Shuffle recipient order so sends look less mechanical. */
  randomizeOrder: boolean
  /** Emit a "typing…" presence before each message. */
  simulateTyping: boolean
}

export interface CsvSettings {
  /** Default country calling code (digits only, '' = none) for national numbers. */
  defaultCountryCode: string
}

export interface MessageSettings {
  /** What to do when a template token has no value for a contact. */
  missingToken: MissingTokenStrategy
  /** Append an opt-out line to every message. */
  optOutFooterEnabled: boolean
  /** The opt-out footer text (appended on its own line). */
  optOutFooterText: string
}

export interface ConnectionSettings {
  /** Mark the WhatsApp session online while the app runs. */
  appearOnline: boolean
  /** Automatically reconnect after a transient disconnect. */
  autoReconnect: boolean
}

export interface AppSettings {
  schemaVersion: number
  language: LanguagePreference
  /** A theme id from `themes.ts`, or 'system' to follow the OS scheme. */
  theme: string
  /** Disable non-essential animations/transitions. */
  reduceMotion: boolean
  telemetryEnabled: boolean
  pacing: PacingSettings
  csv: CsvSettings
  message: MessageSettings
  connection: ConnectionSettings
  /** Check for and download updates automatically (production only). */
  autoUpdate: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: SCHEMA_VERSION,
  language: 'system',
  theme: 'system',
  reduceMotion: false,
  telemetryEnabled: true,
  pacing: {
    minDelayMs: 3000,
    maxDelayMs: 8000,
    perRunCap: 0,
    batchSize: 0,
    batchPauseMs: 60_000,
    stopAfterFailures: 0,
    randomizeOrder: false,
    simulateTyping: false
  },
  csv: { defaultCountryCode: '' },
  message: { missingToken: 'keep', optOutFooterEnabled: false, optOutFooterText: '' },
  connection: { appearOnline: false, autoReconnect: true },
  autoUpdate: true
}

export interface PacingPreset {
  id: 'cautious' | 'balanced' | 'fast'
  minDelayMs: number
  maxDelayMs: number
}

/** Curated min/max presets, ordered safest-first. */
export const PACING_PRESETS: readonly PacingPreset[] = [
  { id: 'cautious', minDelayMs: 8000, maxDelayMs: 20_000 },
  { id: 'balanced', minDelayMs: 3000, maxDelayMs: 8000 },
  { id: 'fast', minDelayMs: 1500, maxDelayMs: 4000 }
]

export type RiskLevel = 'safe' | 'caution' | 'danger'

/**
 * Classify how risky a min/max pacing window is. Used to drive the ban-risk
 * warning shown next to the pacing controls.
 */
export function pacingRisk(window: {
  minDelayMs: number
  maxDelayMs: number
}): RiskLevel {
  const avg = (window.minDelayMs + window.maxDelayMs) / 2
  if (window.minDelayMs < 1500 || avg < 2500) return 'danger'
  if (window.minDelayMs < 3000 || avg < 5000) return 'caution'
  return 'safe'
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n =
    typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.min(max, Math.max(min, n))
}

function coerceBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function coerceLanguage(value: unknown): LanguagePreference {
  return value === 'system' || isSupportedLanguage(value as string)
    ? (value as LanguagePreference)
    : DEFAULT_SETTINGS.language
}

function coerceMissingToken(value: unknown): MissingTokenStrategy {
  return value === 'keep' || value === 'blank'
    ? value
    : DEFAULT_SETTINGS.message.missingToken
}

function coercePacing(raw: unknown): PacingSettings {
  const r = (raw ?? {}) as Partial<PacingSettings>
  const d = DEFAULT_SETTINGS.pacing
  const minDelayMs = clampInt(r.minDelayMs, d.minDelayMs, MIN_DELAY_FLOOR_MS, 600_000)
  const maxDelayMs = Math.max(
    minDelayMs,
    clampInt(r.maxDelayMs, d.maxDelayMs, MIN_DELAY_FLOOR_MS, 600_000)
  )
  return {
    minDelayMs,
    maxDelayMs,
    perRunCap: clampInt(r.perRunCap, d.perRunCap, 0, 100_000),
    batchSize: clampInt(r.batchSize, d.batchSize, 0, 100_000),
    batchPauseMs: clampInt(r.batchPauseMs, d.batchPauseMs, 0, 3_600_000),
    stopAfterFailures: clampInt(r.stopAfterFailures, d.stopAfterFailures, 0, 100_000),
    randomizeOrder: coerceBool(r.randomizeOrder, d.randomizeOrder),
    simulateTyping: coerceBool(r.simulateTyping, d.simulateTyping)
  }
}

/**
 * Coerce arbitrary persisted JSON into a complete, valid {@link AppSettings},
 * filling defaults and clamping out-of-range values. Tolerates the legacy
 * `{ language }`-only shape (schemaVersion < 3) by merging onto the defaults.
 */
export function coerceSettings(raw: unknown): AppSettings {
  const r = (raw ?? {}) as Partial<AppSettings>
  const csv = (r.csv ?? {}) as Partial<CsvSettings>
  const message = (r.message ?? {}) as Partial<MessageSettings>
  const connection = (r.connection ?? {}) as Partial<ConnectionSettings>
  return {
    schemaVersion: SCHEMA_VERSION,
    language: coerceLanguage(r.language),
    theme: typeof r.theme === 'string' ? r.theme : DEFAULT_SETTINGS.theme,
    reduceMotion: coerceBool(r.reduceMotion, DEFAULT_SETTINGS.reduceMotion),
    telemetryEnabled: coerceBool(r.telemetryEnabled, DEFAULT_SETTINGS.telemetryEnabled),
    pacing: coercePacing(r.pacing),
    csv: {
      defaultCountryCode:
        typeof csv.defaultCountryCode === 'string'
          ? csv.defaultCountryCode.replace(/\D/g, '').slice(0, 4)
          : DEFAULT_SETTINGS.csv.defaultCountryCode
    },
    message: {
      missingToken: coerceMissingToken(message.missingToken),
      optOutFooterEnabled: coerceBool(
        message.optOutFooterEnabled,
        DEFAULT_SETTINGS.message.optOutFooterEnabled
      ),
      optOutFooterText:
        typeof message.optOutFooterText === 'string'
          ? message.optOutFooterText.slice(0, 280)
          : DEFAULT_SETTINGS.message.optOutFooterText
    },
    connection: {
      appearOnline: coerceBool(
        connection.appearOnline,
        DEFAULT_SETTINGS.connection.appearOnline
      ),
      autoReconnect: coerceBool(
        connection.autoReconnect,
        DEFAULT_SETTINGS.connection.autoReconnect
      )
    },
    autoUpdate: coerceBool(r.autoUpdate, DEFAULT_SETTINGS.autoUpdate)
  }
}

/** A partial patch accepted by `updateSettings` (one level deep per section). */
export type SettingsPatch = {
  [K in keyof AppSettings]?: AppSettings[K] extends object
    ? Partial<AppSettings[K]>
    : AppSettings[K]
}
