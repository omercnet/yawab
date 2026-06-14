import type { LanguageCode, LanguagePreference } from './locales'
import type {
  ConnectionStatus,
  Contact,
  ParsedContacts,
  SendOptions,
  SendProgress,
  SendResult
} from './types'

/** Channel names for renderer -> main invoke calls. */
export const IpcChannels = {
  connect: 'wa:connect',
  logout: 'wa:logout',
  getStatus: 'wa:get-status',
  parseCsv: 'csv:parse',
  startSend: 'send:start',
  cancelSend: 'send:cancel',
  getLanguage: 'settings:get-language',
  setLanguage: 'settings:set-language'
} as const

/** Channel names for main -> renderer push events. */
export const IpcEvents = {
  status: 'wa:status',
  qr: 'wa:qr',
  sendProgress: 'send:progress',
  sendComplete: 'send:complete'
} as const

export interface StartSendPayload {
  contacts: Contact[]
  template: string
  options: SendOptions
}

/** Resolved language state surfaced to the renderer. */
export interface LanguageSettings {
  /** The user's stored preference ("system" or an explicit code). */
  preference: LanguagePreference
  /** The raw OS locale, e.g. "he-IL". */
  systemLocale: string
  /** The concrete language to actually use. */
  resolved: LanguageCode
}

/** The typed API exposed on `window.api` via the preload bridge. */
export interface RendererApi {
  connect(): Promise<ConnectionStatus>
  logout(): Promise<void>
  getStatus(): Promise<ConnectionStatus>
  parseCsv(content: string): Promise<ParsedContacts>
  startSend(payload: StartSendPayload): Promise<void>
  cancelSend(): Promise<void>
  getLanguageSettings(): Promise<LanguageSettings>
  setLanguage(preference: LanguagePreference): Promise<LanguageCode>
  onStatus(cb: (status: ConnectionStatus) => void): () => void
  onQr(cb: (qrDataUrl: string) => void): () => void
  onSendProgress(cb: (progress: SendProgress) => void): () => void
  onSendComplete(cb: (results: SendResult[]) => void): () => void
}
