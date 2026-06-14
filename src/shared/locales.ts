/**
 * Supported languages and locale-resolution helpers shared between the Electron
 * main process (system-locale detection, persisted preference) and the renderer
 * (i18next initialization, text direction).
 */

export type LanguageCode = 'en' | 'he' | 'ru' | 'ar' | 'es'

/** A persisted preference: an explicit language, or follow the OS locale. */
export type LanguagePreference = 'system' | LanguageCode

export type TextDirection = 'ltr' | 'rtl'

export interface LanguageMeta {
  code: LanguageCode
  /** English name of the language. */
  name: string
  /** Endonym — the language's name in its own script. */
  nativeName: string
  dir: TextDirection
}

export const SUPPORTED_LANGUAGES: readonly LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' }
] as const

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

const SUPPORTED_CODES = new Set<string>(SUPPORTED_LANGUAGES.map((l) => l.code))

const LOCALE_SEPARATOR = /[-_]/

/** Type guard: is the given string one of our supported language codes? */
export function isSupportedLanguage(
  value: string | null | undefined
): value is LanguageCode {
  return value != null && SUPPORTED_CODES.has(value)
}

/**
 * Resolve an arbitrary BCP-47 locale (e.g. "he-IL", "ar_EG", "en-US") to one of
 * our supported language codes, falling back to {@link DEFAULT_LANGUAGE}.
 */
export function resolveLanguage(locale: string | null | undefined): LanguageCode {
  if (!locale) return DEFAULT_LANGUAGE
  const primary = locale.trim().toLowerCase().split(LOCALE_SEPARATOR)[0]
  return isSupportedLanguage(primary) ? primary : DEFAULT_LANGUAGE
}

/**
 * Resolve a stored preference plus the system locale into a concrete language.
 * An explicit, still-supported preference wins; otherwise we follow the OS.
 */
export function resolvePreference(
  preference: LanguagePreference | string | null | undefined,
  systemLocale: string | null | undefined
): LanguageCode {
  if (isSupportedLanguage(preference)) return preference
  return resolveLanguage(systemLocale)
}

/** Text direction for a language code (defaults to LTR for unknown input). */
export function directionOf(code: string | null | undefined): TextDirection {
  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === code)
  return meta?.dir ?? 'ltr'
}
