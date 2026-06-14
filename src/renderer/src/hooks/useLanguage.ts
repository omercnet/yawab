import type { LanguagePreference } from '@shared/locales'
import { useCallback, useEffect, useState } from 'react'
import { applyLanguage } from '../i18n'

export interface LanguageState {
  preference: LanguagePreference
  setPreference: (preference: LanguagePreference) => Promise<void>
}

/** Loads the stored language preference and persists changes via IPC. */
export function useLanguage(): LanguageState {
  const [preference, setPreferenceState] = useState<LanguagePreference>('system')

  useEffect(() => {
    let active = true
    window.api.getLanguageSettings().then((settings) => {
      if (active) setPreferenceState(settings.preference)
    })
    return () => {
      active = false
    }
  }, [])

  const setPreference = useCallback(async (next: LanguagePreference) => {
    const resolved = await window.api.setLanguage(next)
    setPreferenceState(next)
    applyLanguage(resolved)
  }, [])

  return { preference, setPreference }
}
