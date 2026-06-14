import { type LanguagePreference, SUPPORTED_LANGUAGES } from '@shared/locales'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

interface LanguageSelectorProps {
  preference: LanguagePreference
  onChange: (preference: LanguagePreference) => void
}

export function LanguageSelector({
  preference,
  onChange
}: LanguageSelectorProps): JSX.Element {
  const { t } = useTranslation()
  const selectId = useId()

  return (
    <div className="language-selector">
      <label className="visually-hidden" htmlFor={selectId}>
        {t('language.label')}
      </label>
      <span className="language-selector__icon" aria-hidden="true">
        🌐
      </span>
      <select
        id={selectId}
        className="language-selector__select"
        value={preference}
        onChange={(e) => onChange(e.target.value as LanguagePreference)}
      >
        <option value="system">{t('language.system')}</option>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  )
}
