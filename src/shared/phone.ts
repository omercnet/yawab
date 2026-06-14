/**
 * Phone number normalization for WhatsApp JIDs.
 *
 * WhatsApp addresses individual users by a JID of the form
 * `<country-code><number>@s.whatsapp.net`, where the number contains only
 * digits (no '+', spaces, or punctuation).
 */

const WHATSAPP_USER_SUFFIX = '@s.whatsapp.net'

const NON_DIGITS = /\D/g
const LEADING_DOUBLE_ZERO = /^00/
const LEADING_ZERO = /^0/

/** Strip everything except digits, preserving a single leading '+' if present. */
function stripFormatting(input: string): { digits: string; hadPlus: boolean } {
  const trimmed = input.trim()
  const hadPlus = trimmed.startsWith('+') || trimmed.startsWith('00')
  const digits = trimmed.replace(NON_DIGITS, '').replace(LEADING_DOUBLE_ZERO, '')
  return { digits, hadPlus }
}

export interface NormalizeOptions {
  /**
   * Default country calling code (digits only, e.g. "1", "44", "972") used when
   * a number has no international prefix and looks like a national number.
   */
  defaultCountryCode?: string
}

/**
 * Normalize a raw phone string to bare international digits.
 *
 * Returns null when the value cannot plausibly be a phone number.
 */
export function normalizePhone(
  raw: string,
  options: NormalizeOptions = {}
): string | null {
  if (raw == null) return null
  const { digits } = stripFormatting(String(raw))

  if (digits.length === 0) return null
  // Reject obviously-too-short or absurdly long values.
  if (digits.length < 7 || digits.length > 15) return null

  const cc = options.defaultCountryCode?.replace(NON_DIGITS, '')
  if (cc && digits.length <= 11 && !digits.startsWith(cc)) {
    // Treat as a national number missing its country code. Drop a single
    // national trunk '0' prefix before prepending the country code.
    const national = digits.replace(LEADING_ZERO, '')
    const combined = cc + national
    if (combined.length >= 7 && combined.length <= 15) return combined
  }

  return digits
}

/** Convert bare international digits into a WhatsApp user JID. */
export function toJid(digits: string): string {
  return `${digits}${WHATSAPP_USER_SUFFIX}`
}

/** Convenience: normalize then convert to a JID in one step. */
export function phoneToJid(raw: string, options: NormalizeOptions = {}): string | null {
  const normalized = normalizePhone(raw, options)
  return normalized ? toJid(normalized) : null
}
