import Papa from 'papaparse'
import { type NormalizeOptions, normalizePhone } from './phone'
import type { Contact, ParsedContacts } from './types'

/** Column header candidates we recognise for the name and phone fields. */
const NAME_KEYS = ['name', 'full name', 'fullname', 'contact', 'first name', 'firstname']
const PHONE_KEYS = [
  'phone',
  'number',
  'mobile',
  'cell',
  'tel',
  'telephone',
  'msisdn',
  'whatsapp'
]

export interface ParseOptions extends NormalizeOptions {
  /** Override auto-detection of the phone column. */
  phoneColumn?: string
  /** Override auto-detection of the name column. */
  nameColumn?: string
}

function pickColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map((h) => ({ raw: h, key: h.trim().toLowerCase() }))
  for (const candidate of candidates) {
    const hit = normalized.find((h) => h.key === candidate)
    if (hit) return hit.raw
  }
  // Fall back to a fuzzy contains-match (e.g. "Phone Number").
  for (const candidate of candidates) {
    const hit = normalized.find((h) => h.key.includes(candidate))
    if (hit) return hit.raw
  }
  return undefined
}

/**
 * Parse a CSV string into validated contacts.
 *
 * Auto-detects the name and phone columns from common header names, but these
 * can be overridden via {@link ParseOptions}.
 */
export function parseContactsCsv(
  input: string,
  options: ParseOptions = {}
): ParsedContacts {
  const result = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim()
  })

  const headers = result.meta.fields ?? []
  const phoneColumn = options.phoneColumn ?? pickColumn(headers, PHONE_KEYS)
  const nameColumn = options.nameColumn ?? pickColumn(headers, NAME_KEYS)

  const valid: Contact[] = []
  const invalid: ParsedContacts['invalid'] = []

  if (!phoneColumn) {
    return {
      valid,
      invalid: [
        {
          row: 0,
          reason: 'No phone column found. Expected a header like "phone" or "number".',
          values: {}
        }
      ],
      headers
    }
  }

  result.data.forEach((rowRaw, index) => {
    const row = rowRaw ?? {}
    const rowNumber = index + 2 // +1 for header, +1 for 1-based display
    const rawPhone = (row[phoneColumn] ?? '').trim()
    const name = nameColumn ? (row[nameColumn] ?? '').trim() : ''

    if (!rawPhone) {
      invalid.push({ row: rowNumber, reason: 'Missing phone number', values: row })
      return
    }

    const phone = normalizePhone(rawPhone, options)
    if (!phone) {
      invalid.push({
        row: rowNumber,
        reason: `Invalid phone number: "${rawPhone}"`,
        values: row
      })
      return
    }

    const fields: Record<string, string> = {}
    for (const header of headers) {
      fields[header] = (row[header] ?? '').trim()
    }

    valid.push({ name: name || rawPhone, rawPhone, phone, fields })
  })

  // De-duplicate by normalized phone, keeping the first occurrence.
  const seen = new Set<string>()
  const deduped: Contact[] = []
  for (const contact of valid) {
    if (contact.phone && seen.has(contact.phone)) {
      invalid.push({
        row: -1,
        reason: `Duplicate phone number: ${contact.phone}`,
        values: contact.fields
      })
      continue
    }
    if (contact.phone) seen.add(contact.phone)
    deduped.push(contact)
  }

  return { valid: deduped, invalid, headers }
}
