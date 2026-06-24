import { expect, launchAppAt, tempUserDataDir, test } from './fixtures'

// Force English so the control labels are stable regardless of host OS locale.
test.beforeEach(async ({ page }) => {
  await page.selectOption('.language-selector__select', 'en')
})

test('opens settings, applies a theme, and adjusts pacing', async ({ page }) => {
  const html = page.locator('html')

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  // Picking a theme re-themes the document root immediately.
  await page.getByRole('button', { name: 'Dracula' }).click()
  await expect(html).toHaveAttribute('data-theme', 'dracula')

  // The cautious preset is a safe pace; the risk indicator reflects that.
  await page.getByRole('button', { name: 'Cautious' }).click()
  await expect(page.locator('.risk--safe')).toBeVisible()

  // A toggle flips and stays flipped.
  const randomize = page.getByLabel('Randomize order')
  await expect(randomize).not.toBeChecked()
  await page.getByText('Randomize order', { exact: true }).click()
  await expect(randomize).toBeChecked()

  // Closing returns to the wizard.
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.locator('.card').getByRole('heading', { name: 'Connect your WhatsApp' })
  ).toBeVisible()
})

test('persists the selected theme across restarts', async () => {
  const userDataDir = tempUserDataDir()

  const first = await launchAppAt(userDataDir)
  const firstPage = await first.firstWindow()
  await firstPage.waitForLoadState('domcontentloaded')
  await firstPage.selectOption('.language-selector__select', 'en')
  await firstPage.getByRole('button', { name: 'Settings' }).click()
  await firstPage.getByRole('button', { name: 'Nord' }).click()
  await expect(firstPage.locator('html')).toHaveAttribute('data-theme', 'nord')
  await first.close()

  // Relaunch against the same profile: the theme should be applied on load.
  const second = await launchAppAt(userDataDir)
  const secondPage = await second.firstWindow()
  await secondPage.waitForLoadState('domcontentloaded')
  await expect(secondPage.locator('html')).toHaveAttribute('data-theme', 'nord')
  await second.close()
})

test('telemetry toggle is checked by default', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  const telemetry = page.getByLabel('Error reporting')
  await expect(telemetry).toBeChecked()
})

test('telemetry disabled state persists across restarts', async () => {
  const userDataDir = tempUserDataDir()

  const first = await launchAppAt(userDataDir)
  const firstPage = await first.firstWindow()
  await firstPage.waitForLoadState('domcontentloaded')
  await firstPage.selectOption('.language-selector__select', 'en')
  await firstPage.getByRole('button', { name: 'Settings' }).click()

  const telemetry = firstPage.getByLabel('Error reporting')
  await expect(telemetry).toBeChecked()
  await firstPage.getByText('Error reporting', { exact: true }).click()
  await expect(telemetry).not.toBeChecked()
  await first.close()

  // Relaunch: disabled state must survive.
  const second = await launchAppAt(userDataDir)
  const secondPage = await second.firstWindow()
  await secondPage.waitForLoadState('domcontentloaded')
  await secondPage.selectOption('.language-selector__select', 'en')
  await secondPage.getByRole('button', { name: 'Settings' }).click()
  await expect(secondPage.getByLabel('Error reporting')).not.toBeChecked()
  await second.close()
})
