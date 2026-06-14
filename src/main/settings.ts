import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { isSupportedLanguage, type LanguagePreference } from '@shared/locales'
import { app } from 'electron'

export interface Settings {
  language: LanguagePreference
}

const DEFAULTS: Settings = { language: 'system' }

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function coerceLanguage(value: unknown): LanguagePreference {
  return value === 'system' || isSupportedLanguage(value as string)
    ? (value as LanguagePreference)
    : 'system'
}

/** Read persisted settings, falling back to defaults on any error. */
export function readSettings(): Settings {
  try {
    const parsed = JSON.parse(readFileSync(settingsPath(), 'utf-8'))
    return { language: coerceLanguage(parsed?.language) }
  } catch {
    return { ...DEFAULTS }
  }
}

/** Merge a patch into the persisted settings and return the new state. */
export function writeSettings(patch: Partial<Settings>): Settings {
  const next: Settings = { ...readSettings(), ...patch }
  const path = settingsPath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(next, null, 2), 'utf-8')
  return next
}
