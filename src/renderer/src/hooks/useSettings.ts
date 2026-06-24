import { type AppSettings, DEFAULT_SETTINGS, type SettingsPatch } from '@shared/settings'
import { useCallback, useEffect, useState } from 'react'
import { setTelemetryEnabled } from '../telemetry'
import { applyReduceMotion, applyThemePreference } from '../theme'

export interface SettingsState {
  settings: AppSettings
  loaded: boolean
  update: (patch: SettingsPatch) => Promise<void>
}

/**
 * Loads persisted settings, applies appearance preferences (theme + reduce
 * motion) on mount and on change, and keeps the renderer in sync after writes.
 * When the theme follows the OS ('system'), it re-applies on scheme changes.
 */
export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    window.api.getSettings().then((next) => {
      if (!active) return
      setSettings(next)
      setLoaded(true)
      applyThemePreference(next.theme)
      applyReduceMotion(next.reduceMotion)
      setTelemetryEnabled(next.telemetryEnabled)
    })
    return () => {
      active = false
    }
  }, [])

  // Re-apply the OS-driven theme when the system scheme flips.
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const onChange = (): void => {
      if (settings.theme === 'system') applyThemePreference('system')
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [settings.theme])

  const update = useCallback(async (patch: SettingsPatch) => {
    const next = await window.api.updateSettings(patch)
    setSettings(next)
    setTelemetryEnabled(next.telemetryEnabled)
    if (patch.theme !== undefined) applyThemePreference(next.theme)
    if (patch.reduceMotion !== undefined) applyReduceMotion(next.reduceMotion)
  }, [])

  return { settings, loaded, update }
}
