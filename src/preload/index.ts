import {
  IpcChannels,
  IpcEvents,
  type RendererApi,
  type StartSendPayload
} from '@shared/ipc'
import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron'

function subscribe<T>(channel: string, cb: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: RendererApi = {
  connect: () => ipcRenderer.invoke(IpcChannels.connect),
  logout: () => ipcRenderer.invoke(IpcChannels.logout),
  getStatus: () => ipcRenderer.invoke(IpcChannels.getStatus),
  parseCsv: (content) => ipcRenderer.invoke(IpcChannels.parseCsv, content),
  startSend: (payload: StartSendPayload) =>
    ipcRenderer.invoke(IpcChannels.startSend, payload),
  cancelSend: () => ipcRenderer.invoke(IpcChannels.cancelSend),
  getLanguageSettings: () => ipcRenderer.invoke(IpcChannels.getLanguage),
  setLanguage: (preference) => ipcRenderer.invoke(IpcChannels.setLanguage, preference),
  onStatus: (cb) => subscribe(IpcEvents.status, cb),
  onQr: (cb) => subscribe(IpcEvents.qr, cb),
  onSendProgress: (cb) => subscribe(IpcEvents.sendProgress, cb),
  onSendComplete: (cb) => subscribe(IpcEvents.sendComplete, cb)
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-expect-error -- fallback when context isolation is disabled
  window.api = api
}
