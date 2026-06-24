import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { parseContactsCsv } from '@shared/csv'
import { IpcChannels, IpcEvents, type StartSendPayload } from '@shared/ipc'
import { type LanguagePreference, resolvePreference } from '@shared/locales'
import type { SettingsPatch } from '@shared/settings'
import { renderTemplate } from '@shared/template'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { readSettings, writeSettings } from './settings'
import { initTelemetry, setTelemetryEnabled } from './telemetry'
import { type WhatsAppController, WhatsAppService } from './whatsapp'
import { FakeWhatsAppService } from './whatsapp.fake'

let mainWindow: BrowserWindow | null = null
let whatsapp: WhatsAppController | null = null

const mainDir = dirname(fileURLToPath(import.meta.url))

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 720,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    title: 'Yawab',
    webPreferences: {
      preload: join(mainDir, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(mainDir, '../renderer/index.html'))
  }
}

function send(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function getService(): WhatsAppController {
  if (!whatsapp) {
    whatsapp = process.env.YAWAB_FAKE_WA
      ? new FakeWhatsAppService()
      : new WhatsAppService(join(app.getPath('userData'), 'wa-auth'))
    whatsapp.on('status', (status) => send(IpcEvents.status, status))
    whatsapp.on('qr', (dataUrl) => send(IpcEvents.qr, dataUrl))
    whatsapp.on('progress', (progress) => send(IpcEvents.sendProgress, progress))
    whatsapp.on('complete', (results) => send(IpcEvents.sendComplete, results))
  }
  return whatsapp
}

function registerIpc(): void {
  ipcMain.handle(IpcChannels.connect, () => {
    const service = getService()
    service.configure(readSettings().connection)
    return service.connect()
  })
  ipcMain.handle(IpcChannels.logout, () => getService().logout())
  ipcMain.handle(IpcChannels.getStatus, () => getService().getStatus())
  ipcMain.handle(IpcChannels.cancelSend, () => getService().cancel())

  ipcMain.handle(IpcChannels.parseCsv, (_event, content: string) => {
    const { csv } = readSettings()
    return parseContactsCsv(content, {
      defaultCountryCode: csv.defaultCountryCode || undefined
    })
  })

  ipcMain.handle(IpcChannels.startSend, async (_event, payload: StartSendPayload) => {
    const { contacts, template, options } = payload
    const { message } = readSettings()
    const footer = message.optOutFooterEnabled ? message.optOutFooterText : undefined
    await getService().sendBulk(
      contacts,
      (c) => renderTemplate(template, c, { missingToken: message.missingToken, footer }),
      options
    )
  })

  ipcMain.handle(IpcChannels.getLanguage, () => {
    const { language } = readSettings()
    const systemLocale = app.getLocale()
    return {
      preference: language,
      systemLocale,
      resolved: resolvePreference(language, systemLocale)
    }
  })

  ipcMain.handle(IpcChannels.setLanguage, (_event, preference: LanguagePreference) => {
    const { language } = writeSettings({ language: preference })
    return resolvePreference(language, app.getLocale())
  })

  ipcMain.handle(IpcChannels.getSettings, () => readSettings())

  ipcMain.handle(IpcChannels.updateSettings, (_event, patch: SettingsPatch) => {
    const next = writeSettings(patch)
    whatsapp?.configure(next.connection)
    setTelemetryEnabled(next.telemetryEnabled)
    return next
  })

  ipcMain.handle(IpcChannels.openDataFolder, async () => {
    await shell.openPath(app.getPath('userData'))
  })

  ipcMain.handle(IpcChannels.getAppInfo, () => ({
    version: app.getVersion(),
    dataPath: app.getPath('userData'),
    platform: process.platform
  }))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yawab.app')
  initTelemetry(readSettings().telemetryEnabled)

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpc()
  createWindow()
  void checkForUpdates()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

/**
 * In production, check GitHub Releases for a newer version and notify the user.
 * Imported lazily so dev runs and tests never load the updater. Failures (e.g.
 * offline, or no published release yet) are non-fatal.
 */
async function checkForUpdates(): Promise<void> {
  if (is.dev || process.env.YAWAB_FAKE_WA) return
  if (!readSettings().autoUpdate) return
  try {
    const { autoUpdater } = await import('electron-updater')
    await autoUpdater.checkForUpdatesAndNotify()
  } catch (error) {
    console.error('Update check failed:', error)
  }
}
