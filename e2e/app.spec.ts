import { expect, fixture, test } from './fixtures'

// Keep assertions language-independent of the host OS by forcing English.
test.beforeEach(async ({ page }) => {
  await page.selectOption('.language-selector__select', 'en')
})

test('runs the full pair → upload → compose → send wizard', async ({ page }) => {
  const card = page.locator('.card')

  // Step 1: connect. The fake backend emits a QR then auto-connects.
  await expect(card.getByRole('heading', { name: 'Connect your WhatsApp' })).toBeVisible()
  await card.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect(page.getByText('Connected and ready to send.')).toBeVisible()
  await card.getByRole('button', { name: 'Continue', exact: true }).click()

  // Step 2: upload contacts. The fixture has 2 valid + 1 "unreachable".
  await expect(card.getByRole('heading', { name: 'Upload contacts' })).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles(fixture('contacts.csv'))
  await expect(card.getByText('3 valid')).toBeVisible()
  await card.getByRole('button', { name: /^Continue \(3\)$/ }).click()

  // Step 3: compose with a personalisation token; preview should render.
  await expect(card.getByRole('heading', { name: 'Compose your message' })).toBeVisible()
  await page.getByRole('textbox').fill('Hi {{name}}, hello from Yawab!')
  await expect(card.getByText(/^Preview for/)).toBeVisible()
  await card.getByRole('button', { name: 'Review & send' }).click()

  // Step 4: send. Two contacts succeed, the *0000 number fails.
  await expect(card.getByRole('heading', { name: 'Send', exact: true })).toBeVisible()
  await card.getByRole('button', { name: 'Start sending' }).click()

  await expect(card.getByText(/^Results \(3\)$/)).toBeVisible()
  await expect(page.locator('.result--sent')).toHaveCount(2)
  await expect(page.locator('.result--failed')).toHaveCount(1)
})

test('reports an error for a CSV with no phone column', async ({ page }) => {
  const card = page.locator('.card')
  await card.getByRole('button', { name: 'Connect', exact: true }).click()
  await card.getByRole('button', { name: 'Continue', exact: true }).click()

  await page.locator('input[type="file"]').setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,email\nAda,ada@example.com')
  })
  await expect(card.getByText('0 valid')).toBeVisible()
})

test('downloads an example CSV template', async ({ page, electronApp }) => {
  // Playwright cannot observe Electron's blob downloads, so assert on the
  // main-process will-download event instead (and cancel the actual write).
  await electronApp.evaluate(({ session }) => {
    const g = globalThis as unknown as { __dl?: string | null }
    g.__dl = null
    session.defaultSession.once('will-download', (_event, item) => {
      g.__dl = item.getFilename()
      item.cancel()
    })
  })

  const card = page.locator('.card')
  await card.getByRole('button', { name: 'Connect', exact: true }).click()
  await card.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(card.getByRole('heading', { name: 'Upload contacts' })).toBeVisible()

  await page.getByRole('button', { name: /Download example CSV/ }).click()

  await expect
    .poll(() =>
      electronApp.evaluate(() => (globalThis as unknown as { __dl?: string | null }).__dl)
    )
    .toBe('yawab-contacts-template.csv')
})
