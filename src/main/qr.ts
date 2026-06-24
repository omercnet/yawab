import { renderSVG } from 'uqr'

const SVG_DATA_URL_PREFIX = 'data:image/svg+xml;charset=UTF-8,'

export function renderQrDataUrl(value: string): string {
  const svg = renderSVG(value, { border: 1, pixelSize: 8 })
  return `${SVG_DATA_URL_PREFIX}${encodeURIComponent(svg)}`
}
