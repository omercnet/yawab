import type { Contact, SendOptions } from '@shared/types'
import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ComposeStep } from './components/ComposeStep'
import { ConnectStep } from './components/ConnectStep'
import { ContactsStep } from './components/ContactsStep'
import { LanguageSelector } from './components/LanguageSelector'
import { SendStep } from './components/SendStep'
import { SettingsPage } from './components/SettingsPage'
import { Stepper } from './components/Stepper'
import { useLanguage } from './hooks/useLanguage'
import { useSettings } from './hooks/useSettings'
import { useWhatsApp } from './hooks/useWhatsApp'

export type Step = 'connect' | 'contacts' | 'compose' | 'send'

const STEPS: readonly Step[] = ['connect', 'contacts', 'compose', 'send']

export default function App(): JSX.Element {
  const { t } = useTranslation()
  const wa = useWhatsApp()
  const { preference, setPreference } = useLanguage()
  const { settings, update } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [step, setStep] = useState<Step>('connect')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [template, setTemplate] = useState('')

  const connected = wa.status === 'connected'

  const sendOptions = useMemo<SendOptions>(
    () => ({
      minDelayMs: settings.pacing.minDelayMs,
      maxDelayMs: settings.pacing.maxDelayMs,
      perRunCap: settings.pacing.perRunCap,
      batchSize: settings.pacing.batchSize,
      batchPauseMs: settings.pacing.batchPauseMs,
      stopAfterFailures: settings.pacing.stopAfterFailures,
      randomizeOrder: settings.pacing.randomizeOrder,
      simulateTyping: settings.pacing.simulateTyping
    }),
    [settings.pacing]
  )

  const canVisit = useMemo<Record<Step, boolean>>(
    () => ({
      connect: true,
      contacts: connected,
      compose: connected && contacts.length > 0,
      send: connected && contacts.length > 0 && template.trim().length > 0
    }),
    [connected, contacts.length, template]
  )

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__brand">Yawab</h1>
        <span className="app__subtitle">{t('app.subtitle')}</span>
        <div className="app__header-end">
          <output className={`status-pill status-pill--${wa.status}`}>
            {t(`status.${wa.status}`)}
          </output>
          <LanguageSelector
            preference={preference}
            onChange={(next) => void setPreference(next)}
          />
          <button
            type="button"
            className="icon-btn"
            aria-label={t('settings.open')}
            onClick={() => setSettingsOpen(true)}
          >
            <span aria-hidden="true">⚙️</span>
          </button>
        </div>
      </header>

      {settingsOpen ? (
        <SettingsPage
          settings={settings}
          onUpdate={update}
          languagePreference={preference}
          onLanguageChange={(next) => void setPreference(next)}
          connected={connected}
          onClose={() => setSettingsOpen(false)}
        />
      ) : (
        <>
          <Stepper steps={STEPS} current={step} canVisit={canVisit} onSelect={setStep} />

          <main className="app__body">
            {step === 'connect' && (
              <ConnectStep wa={wa} onContinue={() => setStep('contacts')} />
            )}
            {step === 'contacts' && (
              <ContactsStep
                contacts={contacts}
                onLoaded={setContacts}
                onContinue={() => setStep('compose')}
              />
            )}
            {step === 'compose' && (
              <ComposeStep
                template={template}
                contacts={contacts}
                onChange={setTemplate}
                onContinue={() => setStep('send')}
              />
            )}
            {step === 'send' && (
              <SendStep
                contacts={contacts}
                template={template}
                options={sendOptions}
                connected={connected}
              />
            )}
          </main>
        </>
      )}
    </div>
  )
}
