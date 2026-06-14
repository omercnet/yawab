/**
 * Rasterises an SVG string into an ImageBitmap via a same-origin Blob URL. The
 * SVG carries inline HTML in a <foreignObject>, so this is the "HTML in canvas"
 * bridge that works in every modern browser today.
 *
 * Tier-2 upgrade path (not depended on): the experimental WICG
 * canvas-place-element API (`ctx.drawElementImage` / `texElementImage2D`, behind
 * chrome://flags/#canvas-draw-element) can draw LIVE, interactive DOM instead of
 * a snapshot. We stick to the portable rasterisation here and degrade safely.
 *
 * Returns null on any failure or where the API is unavailable — never throws.
 */
export async function rasterizeSvg(
  svg: string,
  width: number,
  height: number
): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap === 'undefined') {
    return null
  }
  let url: string | undefined
  try {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    url = URL.createObjectURL(blob)
    const img = new Image(width, height)
    img.src = url
    await img.decode()
    return await createImageBitmap(img)
  } catch {
    return null
  } finally {
    if (url) {
      URL.revokeObjectURL(url)
    }
  }
}
