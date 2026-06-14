import { extractTokens, renderTemplate } from '@shared/template'
import type { Contact } from '@shared/types'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface ComposeStepProps {
  template: string
  contacts: Contact[]
  onChange: (value: string) => void
  onContinue: () => void
}

export function ComposeStep({
  template,
  contacts,
  onChange,
  onContinue
}: ComposeStepProps): JSX.Element {
  const { t } = useTranslation()

  const availableTokens = useMemo(() => {
    const tokens = new Set<string>(['name', 'phone'])
    const sample = contacts[0]
    if (sample) {
      for (const key of Object.keys(sample.fields)) tokens.add(key.toLowerCase())
    }
    return [...tokens]
  }, [contacts])

  const usedTokens = useMemo(() => extractTokens(template), [template])
  const unknownTokens = usedTokens.filter((token) => !availableTokens.includes(token))

  const preview = useMemo(() => {
    const sample = contacts[0]
    return sample ? renderTemplate(template, sample) : ''
  }, [template, contacts])

  return (
    <section className="card">
      <h2>{t('compose.title')}</h2>
      <p className="muted">{t('compose.help', { example: '{{name}}' })}</p>

      <div className="tokens">
        {availableTokens.map((token) => (
          <button
            key={token}
            type="button"
            className="token"
            onClick={() => onChange(`${template}{{${token}}}`)}
          >
            {`{{${token}}}`}
          </button>
        ))}
      </div>

      <textarea
        className="composer"
        rows={6}
        aria-label={t('compose.title')}
        placeholder={t('compose.placeholder')}
        value={template}
        onChange={(e) => onChange(e.target.value)}
      />

      {unknownTokens.length > 0 && (
        <p className="error" role="alert">
          {t('compose.unknownTokens', {
            tokens: unknownTokens.map((token) => `{{${token}}}`).join(', ')
          })}
        </p>
      )}

      {preview && (
        <div className="preview-box">
          <span className="preview-box__label">
            {t('compose.previewFor', { name: contacts[0]?.name })}
          </span>
          <p>{preview}</p>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary"
        disabled={template.trim().length === 0}
        onClick={onContinue}
      >
        {t('compose.review')}
      </button>
    </section>
  )
}
