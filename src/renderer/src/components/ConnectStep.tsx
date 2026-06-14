import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { WhatsAppState } from '../hooks/useWhatsApp'

interface ConnectStepProps {
  wa: WhatsAppState
  onContinue: () => void
}

export function ConnectStep({ wa, onContinue }: ConnectStepProps): JSX.Element {
  const { t } = useTranslation()
  const { status, qr } = wa
  const busy = status === 'connecting' || status === 'qr'

  return (
    <section className="card">
      <h2>{t('connect.title')}</h2>
      <p className="muted">{t('connect.instructions')}</p>

      {status === 'connected' ? (
        <div className="connect__done">
          <div className="checkmark" aria-hidden="true">
            ✓
          </div>
          <p>{t('connect.ready')}</p>
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={onContinue}>
              {t('connect.continue')}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void wa.logout()}
            >
              {t('connect.logout')}
            </button>
          </div>
        </div>
      ) : (
        <div className="connect__qr">
          {qr ? (
            <img src={qr} alt={t('connect.qrAlt')} width={280} height={280} />
          ) : (
            <div className="qr-placeholder">
              {busy ? t('connect.generating') : t('connect.press')}
            </div>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void wa.connect()}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? t('connect.waiting') : t('connect.connect')}
          </button>
        </div>
      )}
    </section>
  )
}
