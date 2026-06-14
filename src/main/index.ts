import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { parseContactsCsv } from '@shared/csv'
import { IpcChannels, IpcEvents, type StartSendPayload } from '@shared/ipc'
import { type LanguagePreference, resolvePreference } from '@shared/locales'
import { renderTemplate } from '@shared/template'
import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { readSettings, writeSettings } from './settings'
import { type WhatsAppController, WhatsAppService } from './whatsapp'
import { FakeWhatsAppService } from './whatsapp.fake'

let mainWindow: BrowserWindow | null = null
let whatsapp: WhatsAppController | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 720,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    title: 'Yawn',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
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
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function send(channel: string, payload: unknown): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

function getService(): WhatsAppController {
  if (!whatsapp) {
    whatsapp = process.env.YAWN_FAKE_WA
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
  ipcMain.handle(IpcChannels.connect, () => getService().connect())
  ipcMain.handle(IpcChannels.logout, () => getService().logout())
  ipcMain.handle(IpcChannels.getStatus, () => getService().getStatus())
  ipcMain.handle(IpcChannels.cancelSend, () => getService().cancel())

  ipcMain.handle(IpcChannels.parseCsv, (_event, content: string) =>
    parseContactsCsv(content)
  )

  ipcMain.handle(IpcChannels.startSend, async (_event, payload: StartSendPayload) => {
    const { contacts, template, options } = payload
    await getService().sendBulk(contacts, (c) => renderTemplate(template, c), options)
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
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yawn.app')

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
  if (is.dev || process.env.YAWN_FAKE_WA) return
  try {
    const { autoUpdater } = await import('electron-updater')
    await autoUpdater.checkForUpdatesAndNotify()
  } catch (error) {
    console.error('Update check failed:', error)
  }
}
