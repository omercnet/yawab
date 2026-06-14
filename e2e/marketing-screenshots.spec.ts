import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  _electron,
  type ElectronApplication,
  expect,
  type Page,
  test
} from '@playwright/test'
import type { StartSendPayload } from '../src/shared/ipc'
import { appRoot, fixture, gotoContacts, setLanguage, tempUserDataDir } from './fixtures'

const screenshotDir = join(appRoot, 'website', 'public', 'screenshots')

test('generate high-DPI website marketing screenshots', async () => {
  test.skip(
    !process.env.GENERATE_SCREENSHOTS,
    'asset generator — run via `pnpm screenshots:marketing`, not the e2e suite'
  )
  await mkdir(screenshotDir, { recursive: true })

  const electronApp = await launchMarketingApp()
  try {
    const page = await electronApp.firstWindow()
    await electronApp.evaluate(({ BrowserWindow }) => {
      BrowserWindow.getAllWindows()[0]?.setContentSize(960, 720)
    })
    await page.waitForLoadState('domcontentloaded')
    await stabilizeRenderer(page)
    await setLanguage(page, 'en')

    const card = page.locator('.card')
    await expect(
      card.getByRole('heading', { name: 'Connect your WhatsApp' })
    ).toBeVisible()
    await capture(page, 'connect')

    await gotoContacts(page)
    await page.locator('input[type="file"]').setInputFiles(fixture('contacts.csv'))
    await expect(card.getByText('3 valid')).toBeVisible()
    await capture(page, 'contacts')

    await card.getByRole('button', { name: /^Continue \(3\)$/ }).click()
    await expect(
      card.getByRole('heading', { name: 'Compose your message' })
    ).toBeVisible()
    await page
      .getByRole('textbox')
      .fill('Hi {{name}}, your {{company}} update is ready from Yawab.')
    await expect(card.getByText(/^Preview for/)).toBeVisible()
    await capture(page, 'compose')

    await card.getByRole('button', { name: 'Review & send' }).click()
    await expect(card.getByRole('heading', { name: 'Send', exact: true })).toBeVisible()
    await holdSendInProgress(electronApp)
    await card.getByRole('button', { name: 'Start sending' }).click()
    await expect(page.locator('.progress__bar')).toBeVisible()
    await expect(card.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(card.getByText('Sending to Grace Hopper')).toBeVisible()
    await capture(page, 'sending')
  } finally {
    await electronApp.close()
  }
})

async function launchMarketingApp(): Promise<ElectronApplication> {
  return _electron.launch({
    args: [
      appRoot,
      '--no-sandbox',
      '--force-device-scale-factor=2',
      `--user-data-dir=${tempUserDataDir()}`
    ],
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      NODE_ENV: 'production',
      TZ: 'UTC',
      YAWAB_FAKE_WA: '1'
    }
  })
}

async function stabilizeRenderer(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        caret-color: transparent !important;
        transition: none !important;
      }
    `
  })
  await expect.poll(() => page.evaluate(() => window.devicePixelRatio)).toBe(2)
}

async function holdSendInProgress(electronApp: ElectronApplication): Promise<void> {
  await electronApp.evaluate(({ BrowserWindow, ipcMain }) => {
    ipcMain.removeHandler('send:start')
    ipcMain.handle('send:start', (_event, payload: StartSendPayload) => {
      const current = payload.contacts[1] ?? payload.contacts[0]
      BrowserWindow.getAllWindows()[0]?.webContents.send('send:progress', {
        current,
        done: false,
        failed: 0,
        sent: 1,
        skipped: 0,
        total: payload.contacts.length
      })
      return new Promise<void>(() => {})
    })
  })
}

async function capture(page: Page, name: string): Promise<void> {
  await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    path: join(screenshotDir, `${name}.png`)
  })
}
