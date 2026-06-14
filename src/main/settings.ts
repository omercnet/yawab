import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type AppSettings, coerceSettings, DEFAULT_SETTINGS } from '@shared/settings'
import { app } from 'electron'

export type { AppSettings } from '@shared/settings'

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

/** Read persisted settings, coercing/migrating and falling back to defaults. */
export function readSettings(): AppSettings {
  try {
    const parsed = JSON.parse(readFileSync(settingsPath(), 'utf-8'))
    return coerceSettings(parsed)
  } catch {
    return coerceSettings(DEFAULT_SETTINGS)
  }
}

/**
 * Merge a (possibly deep/partial) patch into the persisted settings and return
 * the re-coerced new state. Nested objects are shallow-merged per section so
 * callers can patch a single field (e.g. `{ pacing: { minDelayMs: 5000 } }`).
 */
export function writeSettings(patch: DeepPartial<AppSettings>): AppSettings {
  const current = readSettings()
  const merged = {
    ...current,
    ...patch,
    pacing: { ...current.pacing, ...patch.pacing },
    csv: { ...current.csv, ...patch.csv },
    message: { ...current.message, ...patch.message },
    connection: { ...current.connection, ...patch.connection }
  }
  const next = coerceSettings(merged)
  const path = settingsPath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(next, null, 2), 'utf-8')
  return next
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K]
}
