import { defineConfig } from '@playwright/test'

/**
 * End-to-end tests drive the built Electron app (out/) with a fake WhatsApp
 * backend (YAWAB_FAKE_WA), so run `npm run build` first. Electron is single
 * instance per launch, so we keep workers serial.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Animations off + a small tolerance for cross-machine font anti-aliasing.
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02
    }
  },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list'
})
