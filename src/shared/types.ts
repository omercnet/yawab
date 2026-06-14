/** A single contact parsed from a CSV row. */
export interface Contact {
  /** Display name used for the {{name}} template token. */
  name: string
  /** Raw phone value exactly as it appeared in the CSV. */
  rawPhone: string
  /** E.164-style digits (no '+', no separators), or null if it could not be parsed. */
  phone: string | null
  /** Arbitrary extra columns from the CSV, usable as template tokens. */
  fields: Record<string, string>
}

/** Result of parsing a CSV buffer into contacts. */
export interface ParsedContacts {
  /** Contacts that have a usable phone number. */
  valid: Contact[]
  /** Rows that failed validation, with a human readable reason. */
  invalid: Array<{ row: number; reason: string; values: Record<string, string> }>
  /** Header columns discovered in the CSV. */
  headers: string[]
}

/** Connection lifecycle states surfaced to the renderer. */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'qr'
  | 'connected'
  | 'logged-out'

/** Per-contact send outcome. */
export interface SendResult {
  contact: Contact
  status: 'sent' | 'failed' | 'skipped'
  error?: string
  at: number
}

/** Live progress of a bulk send campaign. */
export interface SendProgress {
  total: number
  sent: number
  failed: number
  skipped: number
  current?: Contact
  done: boolean
}

/** Options controlling pacing of a bulk send. */
export interface SendOptions {
  /** Minimum delay between messages in milliseconds. */
  minDelayMs: number
  /** Maximum delay between messages in milliseconds (random jitter up to this). */
  maxDelayMs: number
}

export const DEFAULT_SEND_OPTIONS: SendOptions = {
  minDelayMs: 3000,
  maxDelayMs: 8000
}
