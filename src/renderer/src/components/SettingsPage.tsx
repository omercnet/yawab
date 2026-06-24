import type { AppInfo } from '@shared/ipc'
import { type LanguagePreference, SUPPORTED_LANGUAGES } from '@shared/locales'
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  MIN_DELAY_FLOOR_MS,
  PACING_PRESETS,
  pacingRisk,
  type SettingsPatch
} from '@shared/settings'
import { THEMES, type Theme } from '@shared/themes'
import type { JSX, ReactNode } from 'react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { prefersDark, resolveThemePreview } from '../theme'

interface SettingsPageProps {
  settings: AppSettings
  onUpdate: (patch: SettingsPatch) => void
  languagePreference: LanguagePreference
  onLanguageChange: (preference: LanguagePreference) => void
  connected: boolean
  onClose: () => void
}

const MS_PER_SEC = 1000

export function SettingsPage({
  settings,
  onUpdate,
  languagePreference,
  onLanguageChange,
  connected,
  onClose
}: SettingsPageProps): JSX.Element {
  const { t } = useTranslation()
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState(false)

  useEffect(() => {
    let active = true
    window.api.getAppInfo().then((next) => {
      if (active) setInfo(next)
    })
    return () => {
      active = false
    }
  }, [])

  const { pacing, message, csv, connection } = settings
  const risk = pacingRisk(pacing)

  return (
    <div className="settings">
      <div className="settings__bar">
        <h2 className="settings__title">{t('settings.title')}</h2>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t('settings.done')}
        </button>
      </div>

      <div className="settings__scroll">
        {/* Sending & pacing ------------------------------------------------ */}
        <Section
          title={t('settings.pacing.title')}
          description={t('settings.pacing.description')}
        >
          <div className="preset-row">
            {PACING_PRESETS.map((preset) => {
              const active =
                pacing.minDelayMs === preset.minDelayMs &&
                pacing.maxDelayMs === preset.maxDelayMs
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset${active ? ' preset--active' : ''}`}
                  onClick={() =>
                    onUpdate({
                      pacing: {
                        minDelayMs: preset.minDelayMs,
                        maxDelayMs: preset.maxDelayMs
                      }
                    })
                  }
                >
                  {t(`settings.pacing.preset.${preset.id}`)}
                </button>
              )
            })}
          </div>

          <div className="field-row">
            <NumberField
              label={t('settings.pacing.minLabel')}
              value={Math.round(pacing.minDelayMs / MS_PER_SEC)}
              min={Math.ceil(MIN_DELAY_FLOOR_MS / MS_PER_SEC)}
              max={600}
              suffix={t('settings.unit.seconds')}
              onCommit={(sec) => onUpdate({ pacing: { minDelayMs: sec * MS_PER_SEC } })}
            />
            <NumberField
              label={t('settings.pacing.maxLabel')}
              value={Math.round(pacing.maxDelayMs / MS_PER_SEC)}
              min={Math.ceil(MIN_DELAY_FLOOR_MS / MS_PER_SEC)}
              max={600}
              suffix={t('settings.unit.seconds')}
              onCommit={(sec) => onUpdate({ pacing: { maxDelayMs: sec * MS_PER_SEC } })}
            />
          </div>

          <p className={`risk risk--${risk}`} role="status">
            <span className="risk__dot" aria-hidden="true" />
            {t(`settings.pacing.risk.${risk}`)}
          </p>
          <p className="setting__hint">{t('settings.pacing.floorHint')}</p>

          <NumberField
            label={t('settings.pacing.capLabel')}
            hint={t('settings.pacing.capHint')}
            value={pacing.perRunCap}
            min={0}
            max={100000}
            suffix={t('settings.unit.messages')}
            onCommit={(v) => onUpdate({ pacing: { perRunCap: v } })}
          />
          <div className="field-row">
            <NumberField
              label={t('settings.pacing.batchSizeLabel')}
              value={pacing.batchSize}
              min={0}
              max={100000}
              suffix={t('settings.unit.messages')}
              onCommit={(v) => onUpdate({ pacing: { batchSize: v } })}
            />
            <NumberField
              label={t('settings.pacing.batchPauseLabel')}
              value={Math.round(pacing.batchPauseMs / MS_PER_SEC)}
              min={0}
              max={3600}
              suffix={t('settings.unit.seconds')}
              onCommit={(sec) => onUpdate({ pacing: { batchPauseMs: sec * MS_PER_SEC } })}
            />
          </div>
          <NumberField
            label={t('settings.pacing.stopFailuresLabel')}
            hint={t('settings.pacing.stopFailuresHint')}
            value={pacing.stopAfterFailures}
            min={0}
            max={100000}
            suffix={t('settings.unit.failures')}
            onCommit={(v) => onUpdate({ pacing: { stopAfterFailures: v } })}
          />
          <Toggle
            label={t('settings.pacing.randomizeLabel')}
            hint={t('settings.pacing.randomizeHint')}
            checked={pacing.randomizeOrder}
            onChange={(v) => onUpdate({ pacing: { randomizeOrder: v } })}
          />
          <Toggle
            label={t('settings.pacing.typingLabel')}
            hint={t('settings.pacing.typingHint')}
            checked={pacing.simulateTyping}
            onChange={(v) => onUpdate({ pacing: { simulateTyping: v } })}
          />
        </Section>

        {/* Message defaults ------------------------------------------------ */}
        <Section
          title={t('settings.message.title')}
          description={t('settings.message.description')}
        >
          <SelectField
            label={t('settings.message.missingTokenLabel')}
            hint={t('settings.message.missingTokenHint')}
            value={message.missingToken}
            options={[
              { value: 'keep', label: t('settings.message.missingToken.keep') },
              { value: 'blank', label: t('settings.message.missingToken.blank') }
            ]}
            onChange={(v) =>
              onUpdate({ message: { missingToken: v as 'keep' | 'blank' } })
            }
          />
          <Toggle
            label={t('settings.message.footerLabel')}
            hint={t('settings.message.footerHint')}
            checked={message.optOutFooterEnabled}
            onChange={(v) => onUpdate({ message: { optOutFooterEnabled: v } })}
          />
          {message.optOutFooterEnabled && (
            <TextField
              label={t('settings.message.footerTextLabel')}
              value={message.optOutFooterText}
              placeholder={t('settings.message.footerPlaceholder')}
              onCommit={(v) => onUpdate({ message: { optOutFooterText: v } })}
            />
          )}
        </Section>

        {/* CSV import ------------------------------------------------------ */}
        <Section
          title={t('settings.csv.title')}
          description={t('settings.csv.description')}
        >
          <TextField
            label={t('settings.csv.countryCodeLabel')}
            hint={t('settings.csv.countryCodeHint')}
            value={csv.defaultCountryCode}
            placeholder="1"
            prefix="+"
            inputMode="numeric"
            onCommit={(v) =>
              onUpdate({ csv: { defaultCountryCode: v.replace(/\D/g, '') } })
            }
          />
        </Section>

        {/* Account & connection -------------------------------------------- */}
        <Section
          title={t('settings.account.title')}
          description={t('settings.account.description')}
        >
          <Toggle
            label={t('settings.account.appearOnlineLabel')}
            hint={t('settings.account.appearOnlineHint')}
            checked={connection.appearOnline}
            onChange={(v) => onUpdate({ connection: { appearOnline: v } })}
          />
          <Toggle
            label={t('settings.account.autoReconnectLabel')}
            hint={t('settings.account.autoReconnectHint')}
            checked={connection.autoReconnect}
            onChange={(v) => onUpdate({ connection: { autoReconnect: v } })}
          />
          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('settings.account.unlinkLabel')}</span>
              <p className="setting__hint">{t('settings.account.unlinkHint')}</p>
            </div>
            {confirmUnlink ? (
              <div className="row row--tight">
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => {
                    void window.api.logout()
                    setConfirmUnlink(false)
                  }}
                >
                  {t('settings.account.unlinkConfirm')}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmUnlink(false)}
                >
                  {t('settings.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--danger-outline"
                disabled={!connected}
                onClick={() => setConfirmUnlink(true)}
              >
                {t('settings.account.unlink')}
              </button>
            )}
          </div>
        </Section>

        {/* Appearance ------------------------------------------------------ */}
        <Section
          title={t('settings.appearance.title')}
          description={t('settings.appearance.description')}
        >
          <span className="setting__label">{t('settings.appearance.themeLabel')}</span>
          <div className="theme-grid">
            <ThemeCard
              name={t('settings.appearance.systemTheme')}
              preview={resolveThemePreview('system', prefersDark())}
              selected={settings.theme === 'system'}
              onSelect={() => onUpdate({ theme: 'system' })}
            />
            {THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                name={theme.name}
                preview={theme}
                selected={settings.theme === theme.id}
                onSelect={() => onUpdate({ theme: theme.id })}
              />
            ))}
          </div>
          <Toggle
            label={t('settings.appearance.reduceMotionLabel')}
            hint={t('settings.appearance.reduceMotionHint')}
            checked={settings.reduceMotion}
            onChange={(v) => onUpdate({ reduceMotion: v })}
          />
          <SelectField
            label={t('settings.appearance.languageLabel')}
            value={languagePreference}
            options={[
              { value: 'system', label: t('language.system') },
              ...SUPPORTED_LANGUAGES.map((lang) => ({
                value: lang.code,
                label: lang.nativeName
              }))
            ]}
            onChange={(v) => onLanguageChange(v as LanguagePreference)}
          />
        </Section>

        {/* Updates & data -------------------------------------------------- */}
        <Section
          title={t('settings.data.title')}
          description={t('settings.data.description')}
        >
          <Toggle
            label={t('settings.data.autoUpdateLabel')}
            hint={t('settings.data.autoUpdateHint')}
            checked={settings.autoUpdate}
            onChange={(v) => onUpdate({ autoUpdate: v })}
          />
          <Toggle
            label={t('settings.data.telemetryLabel')}
            hint={t('settings.data.telemetryHint')}
            checked={settings.telemetryEnabled}
            onChange={(v) => onUpdate({ telemetryEnabled: v })}
          />
          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('settings.data.folderLabel')}</span>
              <p className="setting__hint setting__hint--mono">{info?.dataPath ?? '…'}</p>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void window.api.openDataFolder()}
            >
              {t('settings.data.openFolder')}
            </button>
          </div>
          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('settings.data.resetLabel')}</span>
              <p className="setting__hint">{t('settings.data.resetHint')}</p>
            </div>
            <button
              type="button"
              className="btn btn--danger-outline"
              onClick={() => onUpdate(resetPatch())}
            >
              {t('settings.data.reset')}
            </button>
          </div>
          {info && (
            <p className="setting__hint setting__hint--mono">
              {t('settings.data.version', {
                version: info.version,
                platform: info.platform
              })}
            </p>
          )}
        </Section>
      </div>
    </div>
  )
}

/** A full reset patch built from the defaults (excludes language, which has its own flow). */
function resetPatch(): SettingsPatch {
  const { language: _language, schemaVersion: _schema, ...rest } = DEFAULT_SETTINGS
  return rest
}

// --- Small presentational helpers -----------------------------------------

function Section({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="settings-section">
      <header className="settings-section__head">
        <h3 className="settings-section__title">{title}</h3>
        {description && <p className="muted">{description}</p>}
      </header>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}): JSX.Element {
  const id = useId()
  return (
    <div className="setting">
      <div className="setting__text">
        <label htmlFor={id} className="setting__label">
          {label}
        </label>
        {hint && <p className="setting__hint">{hint}</p>}
      </div>
      <label className="switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__track" aria-hidden="true" />
      </label>
    </div>
  )
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  suffix,
  onCommit
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  suffix?: string
  onCommit: (value: number) => void
}): JSX.Element {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = (): void => {
    const parsed = Number.parseInt(draft, 10)
    const clamped = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value
    onCommit(clamped)
    setDraft(String(clamped))
  }

  return (
    <div className="setting setting--inline">
      <div className="setting__text">
        <label htmlFor={id} className="setting__label">
          {label}
        </label>
        {hint && <p className="setting__hint">{hint}</p>}
      </div>
      <div className="num-input">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
        {suffix && <span className="num-input__suffix">{suffix}</span>}
      </div>
    </div>
  )
}

function TextField({
  label,
  hint,
  value,
  placeholder,
  prefix,
  inputMode,
  onCommit
}: {
  label: string
  hint?: string
  value: string
  placeholder?: string
  prefix?: string
  inputMode?: 'text' | 'numeric'
  onCommit: (value: string) => void
}): JSX.Element {
  const id = useId()
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  return (
    <div className="setting setting--inline">
      <div className="setting__text">
        <label htmlFor={id} className="setting__label">
          {label}
        </label>
        {hint && <p className="setting__hint">{hint}</p>}
      </div>
      <div className="text-input">
        {prefix && <span className="text-input__prefix">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode={inputMode ?? 'text'}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onCommit(draft)}
          onKeyDown={(e) => e.key === 'Enter' && onCommit(draft)}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  hint,
  value,
  options,
  onChange
}: {
  label: string
  hint?: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}): JSX.Element {
  const id = useId()
  return (
    <div className="setting setting--inline">
      <div className="setting__text">
        <label htmlFor={id} className="setting__label">
          {label}
        </label>
        {hint && <p className="setting__hint">{hint}</p>}
      </div>
      <select
        id={id}
        className="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ThemeCard({
  name,
  preview,
  selected,
  onSelect
}: {
  name: string
  preview: Theme
  selected: boolean
  onSelect: () => void
}): JSX.Element {
  const { bg, surface, accent, text, border } = preview.tokens
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`theme-card${selected ? ' theme-card--selected' : ''}`}
      onClick={onSelect}
    >
      <span
        className="theme-card__swatch"
        style={{ background: bg, borderColor: border }}
      >
        <span className="theme-card__chip" style={{ background: surface }} />
        <span className="theme-card__chip" style={{ background: accent }} />
        <span className="theme-card__chip" style={{ background: text }} />
      </span>
      <span className="theme-card__name">{name}</span>
    </button>
  )
}
