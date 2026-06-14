import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  _electron,
  test as base,
  type ElectronApplication,
  type Page
} from '@playwright/test'

const currentDir = dirname(fileURLToPath(import.meta.url))
export const appRoot = join(currentDir, '..')

/** Create an isolated, throwaway userData directory for a launch. */
export function tempUserDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'yawab-e2e-'))
}

/** Launch the built Electron app (fake WhatsApp backend) at a given profile. */
export function launchAppAt(userDataDir: string): Promise<ElectronApplication> {
  return _electron.launch({
    args: [appRoot, '--no-sandbox', `--user-data-dir=${userDataDir}`],
    env: { ...process.env, YAWAB_FAKE_WA: '1', NODE_ENV: 'production' }
  })
}

/** Launch the app with a fresh, isolated profile. */
export function launchApp(): Promise<ElectronApplication> {
  return launchAppAt(tempUserDataDir())
}

interface Fixtures {
  electronApp: ElectronApplication
  page: Page
}

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use) => {
    const electronApp = await launchApp()
    await use(electronApp)
    await electronApp.close()
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  }
})

export const expect = test.expect

/** Absolute path to a CSV fixture. */
export function fixture(name: string): string {
  return join(currentDir, 'fixtures', name)
}

/** Force the UI language so screenshots/text are independent of the host OS. */
export async function setLanguage(page: Page, code: string): Promise<void> {
  await page.locator('.language-selector__select').selectOption(code)
}

/** Pair (fake backend auto-connects), then advance to the contacts step. */
export async function gotoContacts(page: Page): Promise<void> {
  const card = page.locator('.card')
  await card.getByRole('button', { name: 'Connect', exact: true }).click()
  await card.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(card.getByRole('heading', { name: 'Upload contacts' })).toBeVisible()
}

/** Continue from contacts (with the sample CSV loaded) to the compose step. */
export async function gotoCompose(page: Page): Promise<void> {
  const card = page.locator('.card')
  await page.locator('input[type="file"]').setInputFiles(fixture('contacts.csv'))
  await card.getByRole('button', { name: /^Continue \(3\)$/ }).click()
  await page.getByRole('textbox').fill('Hi {{name}}, hello from Yawab!')
  await expect(card.getByText(/^Preview for/)).toBeVisible()
}
