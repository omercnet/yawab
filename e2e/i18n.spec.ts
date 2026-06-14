import { expect, launchAppAt, tempUserDataDir, test } from './fixtures'

test('switches language and flips text direction for RTL locales', async ({ page }) => {
  const html = page.locator('html')
  const select = page.locator('.language-selector__select')

  await select.selectOption('he')
  await expect(html).toHaveAttribute('dir', 'rtl')
  await expect(html).toHaveAttribute('lang', 'he')

  await select.selectOption('ar')
  await expect(html).toHaveAttribute('dir', 'rtl')

  await select.selectOption('ru')
  await expect(html).toHaveAttribute('dir', 'ltr')

  await select.selectOption('en')
  await expect(html).toHaveAttribute('dir', 'ltr')
  await expect(
    page.locator('.card').getByRole('heading', { name: 'Connect your WhatsApp' })
  ).toBeVisible()
})

test('persists the language choice across restarts', async () => {
  const userDataDir = tempUserDataDir()

  const first = await launchAppAt(userDataDir)
  const firstPage = await first.firstWindow()
  await firstPage.waitForLoadState('domcontentloaded')
  await firstPage.locator('.language-selector__select').selectOption('he')
  await expect(firstPage.locator('html')).toHaveAttribute('dir', 'rtl')
  await first.close()

  // Relaunch against the same profile: the preference should be remembered.
  const second = await launchAppAt(userDataDir)
  const secondPage = await second.firstWindow()
  await secondPage.waitForLoadState('domcontentloaded')
  await expect(secondPage.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(secondPage.locator('.language-selector__select')).toHaveValue('he')
  await second.close()
})
