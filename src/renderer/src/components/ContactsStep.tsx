import type { Contact, ParsedContacts } from '@shared/types'
import type { JSX } from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// A ready-to-edit template so users can see the expected headers (a phone
// column is required; extra columns like `company` become message tokens).
const TEMPLATE_CSV = `name,phone,company
Ada Lovelace,+1 415 555 2671,Analytical Engines
Grace Hopper,+1 415 555 9000,US Navy
Alan Turing,+44 7911 123456,Bletchley Park
`

function downloadExampleCsv(): void {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'yawab-contacts-template.csv'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
interface ContactsStepProps {
  contacts: Contact[]
  onLoaded: (contacts: Contact[]) => void
  onContinue: () => void
}

export function ContactsStep({
  contacts,
  onLoaded,
  onContinue
}: ContactsStepProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedContacts | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File): Promise<void> {
    setError(null)
    try {
      const text = await file.text()
      const result = await window.api.parseCsv(text)
      setParsed(result)
      setFileName(file.name)
      onLoaded(result.valid)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('contacts.readError'))
    }
  }

  return (
    <section className="card">
      <h2>{t('contacts.title')}</h2>
      <p className="muted">{t('contacts.description')}</p>
      <button type="button" className="link-inline" onClick={downloadExampleCsv}>
        ↓ {t('contacts.downloadExample')}
      </button>

      <button
        type="button"
        className="dropzone"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) void handleFile(file)
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        <span>{fileName ?? t('contacts.dropzone')}</span>
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {parsed && (
        <div className="contacts__summary">
          <div className="stat stat--ok">
            {t('contacts.valid', { count: parsed.valid.length })}
          </div>
          <div className="stat stat--warn">
            {t('contacts.skipped', { count: parsed.invalid.length })}
          </div>
        </div>
      )}

      {parsed && parsed.valid.length > 0 && (
        <table className="preview">
          <thead>
            <tr>
              <th>{t('contacts.thName')}</th>
              <th>{t('contacts.thPhone')}</th>
            </tr>
          </thead>
          <tbody>
            {parsed.valid.slice(0, 8).map((c) => (
              <tr key={c.phone ?? c.rawPhone}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        type="button"
        className="btn btn--primary"
        disabled={contacts.length === 0}
        onClick={onContinue}
      >
        {t('contacts.continue', { count: contacts.length })}
      </button>
    </section>
  )
}
