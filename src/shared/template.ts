import type { Contact } from './types'

/**
 * Render a message template against a contact.
 *
 * Tokens use the `{{token}}` syntax and are matched case-insensitively against
 * the contact's `name`, `phone`, and any extra CSV `fields`. Unknown tokens are
 * left untouched so the user can spot mistakes rather than silently sending
 * blanks.
 */
export function renderTemplate(template: string, contact: Contact): string {
  const lookup = buildLookup(contact)
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, rawToken) => {
    const key = String(rawToken).toLowerCase()
    const value = lookup.get(key)
    return value === undefined ? match : value
  })
}

function buildLookup(contact: Contact): Map<string, string> {
  const lookup = new Map<string, string>()
  lookup.set('name', contact.name ?? '')
  lookup.set('phone', contact.phone ?? contact.rawPhone ?? '')
  for (const [key, value] of Object.entries(contact.fields ?? {})) {
    lookup.set(key.toLowerCase(), value)
  }
  return lookup
}

/** Extract the set of token names referenced by a template. */
export function extractTokens(template: string): string[] {
  const tokens = new Set<string>()
  for (const match of template.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) {
    tokens.add(match[1].toLowerCase())
  }
  return [...tokens]
}
