import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initI18n } from './i18n'
import './styles.css'

async function bootstrap(): Promise<void> {
  const container = document.getElementById('root')
  if (!container) throw new Error('Root element not found')

  // Resolve the language (stored preference or OS locale) before first paint.
  const settings = await window.api.getLanguageSettings()
  initI18n(settings.resolved)

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

void bootstrap()
