import type { Contact, SendOptions, SendProgress, SendResult } from '@shared/types'
import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SendStepProps {
  contacts: Contact[]
  template: string
  options: SendOptions
  connected: boolean
}

export function SendStep({
  contacts,
  template,
  options,
  connected
}: SendStepProps): JSX.Element {
  const { t } = useTranslation()
  const [progress, setProgress] = useState<SendProgress | null>(null)
  const [results, setResults] = useState<SendResult[] | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const offProgress = window.api.onSendProgress(setProgress)
    const offComplete = window.api.onSendComplete((r) => {
      setResults(r)
      setSending(false)
    })
    return () => {
      offProgress()
      offComplete()
    }
  }, [])

  async function start(): Promise<void> {
    setResults(null)
    setSending(true)
    setProgress({ total: contacts.length, sent: 0, failed: 0, skipped: 0, done: false })
    try {
      await window.api.startSend({ contacts, template, options })
    } catch {
      setSending(false)
    }
  }

  const processed = progress ? progress.sent + progress.failed + progress.skipped : 0

  return (
    <section className="card">
      <h2>{t('send.title')}</h2>
      <p className="muted">
        {t('send.summary', {
          count: contacts.length,
          min: Math.round(options.minDelayMs / 1000),
          max: Math.round(options.maxDelayMs / 1000)
        })}
      </p>

      {progress && (
        <div className="progress">
          <progress
            className="progress__bar"
            value={processed}
            max={progress.total}
            aria-label={t('send.title')}
          />
          <div className="progress__stats">
            <span className="stat--ok">{t('send.sent', { count: progress.sent })}</span>
            <span className="stat--warn">
              {t('send.failed', { count: progress.failed })}
            </span>
            <span className="muted">
              {t('send.skipped', { count: progress.skipped })}
            </span>
            <span>
              {processed}/{progress.total}
            </span>
          </div>
          {progress.current && !progress.done && (
            <p className="muted" aria-live="polite">
              {t('send.sendingTo', { name: progress.current.name })}
            </p>
          )}
        </div>
      )}

      <div className="row">
        {sending ? (
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => void window.api.cancelSend()}
          >
            {t('send.cancel')}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void start()}
            disabled={!connected || contacts.length === 0}
          >
            {results ? t('send.again') : t('send.start')}
          </button>
        )}
      </div>

      {results && (
        <details className="results" open>
          <summary>{t('send.results', { count: results.length })}</summary>
          <table className="preview">
            <thead>
              <tr>
                <th>{t('send.thName')}</th>
                <th>{t('send.thPhone')}</th>
                <th>{t('send.thStatus')}</th>
                <th>{t('send.thError')}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.contact.phone ?? r.contact.rawPhone}
                  className={`result--${r.status}`}
                >
                  <td>{r.contact.name}</td>
                  <td>{r.contact.phone}</td>
                  <td>{t(`result.${r.status}`)}</td>
                  <td>{r.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  )
}
