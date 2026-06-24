import { type AppSettings, DEFAULT_SETTINGS } from '@shared/settings'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initI18n } from './i18n'
import { captureException, initTelemetry } from './telemetry'
import './styles.css'

async function bootstrap(): Promise<void> {
  const container = document.getElementById('root')
  if (!container) throw new Error('Root element not found')

  const appSettings = await readBootstrapSettings()
  initTelemetry(appSettings.telemetryEnabled)

  // Resolve the language (stored preference or OS locale) before first paint.
  const settings = await window.api.getLanguageSettings()
  initI18n(settings.resolved)

  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  )
}

async function readBootstrapSettings(): Promise<AppSettings> {
  try {
    return await window.api.getSettings()
  } catch (error) {
    if (error instanceof Error) {
      console.error('Settings load failed; telemetry disabled:', error)
    } else {
      console.error('Settings load failed; telemetry disabled:', String(error))
    }
    return { ...DEFAULT_SETTINGS, telemetryEnabled: false }
  }
}

void bootstrap().catch((error: unknown) => {
  if (error instanceof Error) {
    captureException(error)
    console.error('Renderer bootstrap failed:', error)
  } else {
    console.error('Renderer bootstrap failed:', String(error))
  }
})
