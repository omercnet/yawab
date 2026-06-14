import { DEFAULT_LANGUAGE, directionOf, type LanguageCode } from '@shared/locales'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'
import es from './locales/es.json'
import he from './locales/he.json'
import ru from './locales/ru.json'

export const resources = {
  en: { translation: en },
  he: { translation: he },
  ru: { translation: ru },
  ar: { translation: ar },
  es: { translation: es }
} as const

/** Initialize i18next once and apply the chosen language to the document. */
export function initI18n(language: LanguageCode): typeof i18n {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: DEFAULT_LANGUAGE,
      returnNull: false,
      interpolation: {
        // React already escapes output, so i18next must not double-escape.
        escapeValue: false
      }
    })
  }
  applyLanguage(language)
  return i18n
}

/** Switch the active language and update the document's `lang`/`dir`. */
export function applyLanguage(language: LanguageCode): void {
  void i18n.changeLanguage(language)
  const root = document.documentElement
  root.lang = language
  root.dir = directionOf(language)
}

export default i18n
