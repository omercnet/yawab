export interface BubbleData {
  name: string
  message: string
}

// Curated, recognisable first names — purely decorative sample data.
export const SAMPLE_CONTACTS: readonly string[] = [
  'Ada',
  'Grace',
  'Linus',
  'Margaret',
  'Alan',
  'Katherine',
  'Edsger',
  'Barbara',
  'Dennis',
  'Radia',
  'Hedy',
  'Tim'
]

// Short, friendly templates — every one personalises the {{name}} token, which
// is exactly what the product does. Kept varied so the swarm never feels canned.
export const MESSAGE_TEMPLATES: readonly string[] = [
  'Hi {{name}}! Your order shipped 🎉',
  'Thanks {{name}}, see you Friday!',
  '{{name}}, your code is 4827',
  'Welcome aboard, {{name}} 👋',
  '{{name}} — invoice attached, all set.'
]

const mod = (n: number, m: number): number => ((n % m) + m) % m

/** Deterministic bubble for a given index: cycles contacts, rotates templates. */
export function bubbleAt(index: number): BubbleData {
  const contacts = SAMPLE_CONTACTS
  const templates = MESSAGE_TEMPLATES
  const name = contacts[mod(index, contacts.length)] as string
  const template = templates[
    mod(Math.floor(index / contacts.length), templates.length)
  ] as string
  return { name, message: template.replace(/\{\{name\}\}/g, name) }
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const CONTAINER_STYLE = [
  'display:flex',
  'align-items:center',
  'width:100%',
  'height:100%',
  'box-sizing:border-box',
  'padding:8px 10px',
  "font-family:-apple-system,'Segoe UI',Roboto,sans-serif"
].join(';')

const BUBBLE_STYLE = [
  'max-width:100%',
  'background:linear-gradient(160deg,#123c2e,#0c2c22)',
  'border:1px solid rgba(0,230,118,0.28)',
  'border-radius:6px 14px 14px 14px',
  'padding:9px 12px',
  'box-shadow:0 8px 24px rgba(0,0,0,0.45)',
  'color:#eafff4'
].join(';')

const TEXT_STYLE = ['font-size:15px', 'line-height:1.35', 'margin:0'].join(';')
const META_STYLE = [
  'display:flex',
  'justify-content:flex-end',
  'align-items:center',
  'gap:4px',
  'margin-top:4px',
  'font-size:11px',
  'color:#7fb8a3'
].join(';')

/**
 * Builds a self-contained SVG (with a <foreignObject> HTML bubble) that can be
 * rasterised into a canvas. Uses ONLY a system font stack and inline styles —
 * no external fonts, images, or URLs — so the resulting canvas stays untainted.
 */
export function buildBubbleSvg(
  data: BubbleData,
  opts: { width: number; height: number; scale: number }
): string {
  const { width, height, scale } = opts
  const pxW = Math.round(width * scale)
  const pxH = Math.round(height * scale)
  const name = escapeXml(data.name)
  const message = escapeXml(data.message)
  const withBoldName = message.replace(
    name,
    `<strong style="color:#fff">${name}</strong>`
  )
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}"`,
    ` viewBox="0 0 ${width} ${height}">`,
    '<foreignObject x="0" y="0" width="100%" height="100%">',
    `<div xmlns="http://www.w3.org/1999/xhtml" style="${CONTAINER_STYLE}">`,
    `<div style="${BUBBLE_STYLE}">`,
    `<p style="${TEXT_STYLE}">${withBoldName}</p>`,
    `<div style="${META_STYLE}"><span>12:24</span>`,
    '<span style="color:#34d399">✓✓</span></div>',
    '</div></div></foreignObject></svg>'
  ].join('')
}
