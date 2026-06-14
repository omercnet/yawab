import type { MissingTokenStrategy } from './settings'
import type { Contact } from './types'

export interface RenderOptions {
  /** How to render a `{{token}}` that has no value (default: 'keep'). */
  missingToken?: MissingTokenStrategy
  /** When set, appended on its own line(s) after the body (e.g. an opt-out note). */
  footer?: string
}

/**
 * Render a message template against a contact.
 *
 * Tokens use the `{{token}}` syntax and are matched case-insensitively against
 * the contact's `name`, `phone`, and any extra CSV `fields`. Unknown tokens are
 * either left untouched ('keep', the default) so the user can spot mistakes, or
 * rendered as blank ('blank'). An optional `footer` is appended after the body.
 */
export function renderTemplate(
  template: string,
  contact: Contact,
  options: RenderOptions = {}
): string {
  const lookup = buildLookup(contact)
  const body = template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, rawToken) => {
    const key = String(rawToken).toLowerCase()
    const value = lookup.get(key)
    if (value !== undefined) return value
    return options.missingToken === 'blank' ? '' : match
  })
  const footer = options.footer?.trim()
  return footer ? `${body}\n\n${footer}` : body
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
