import { expect, fixture, gotoCompose, gotoContacts, setLanguage, test } from './fixtures'

/**
 * Visual regression: snapshot every screen of the wizard in a stable state.
 * Baselines are platform-suffixed by Playwright; CI and the dev container both
 * run Linux with the same Noto fonts. Update with `--update-snapshots`.
 */

test('connect screen — English (LTR)', async ({ page }) => {
  await setLanguage(page, 'en')
  await expect(page.locator('.card')).toBeVisible()
  await expect(page).toHaveScreenshot('connect-en.png')
})

test('connect screen — Hebrew (RTL)', async ({ page }) => {
  await setLanguage(page, 'he')
  await expect(page.locator('.card')).toBeVisible()
  await expect(page).toHaveScreenshot('connect-he.png')
})

test('connect screen — Arabic (RTL)', async ({ page }) => {
  await setLanguage(page, 'ar')
  await expect(page.locator('.card')).toBeVisible()
  await expect(page).toHaveScreenshot('connect-ar.png')
})

test('contacts step with a loaded CSV', async ({ page }) => {
  await setLanguage(page, 'en')
  await gotoContacts(page)
  await page.locator('input[type="file"]').setInputFiles(fixture('contacts.csv'))
  await expect(page.locator('.card').getByText('3 valid')).toBeVisible()
  await expect(page).toHaveScreenshot('contacts-loaded.png')
})

test('compose step with live preview', async ({ page }) => {
  await setLanguage(page, 'en')
  await gotoContacts(page)
  await gotoCompose(page)
  await expect(page).toHaveScreenshot('compose-preview.png')
})

test('send step with results', async ({ page }) => {
  const card = page.locator('.card')
  await setLanguage(page, 'en')
  await gotoContacts(page)
  await gotoCompose(page)
  await card.getByRole('button', { name: 'Review & send' }).click()
  await card.getByRole('button', { name: 'Start sending' }).click()
  await expect(card.getByText(/^Results \(3\)$/)).toBeVisible()
  await expect(page).toHaveScreenshot('send-results.png')
})
