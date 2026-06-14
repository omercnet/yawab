import { EventEmitter } from 'node:events'
import { toJid } from '@shared/phone'
import { nextDelay, sleep } from '@shared/throttle'
import type {
  ConnectionStatus,
  Contact,
  SendOptions,
  SendProgress,
  SendResult
} from '@shared/types'
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket
} from '@whiskeysockets/baileys'
import pino from 'pino'
import QRCode from 'qrcode'

export interface WhatsAppEvents {
  status: (status: ConnectionStatus) => void
  qr: (qrDataUrl: string) => void
  progress: (progress: SendProgress) => void
  complete: (results: SendResult[]) => void
}

/**
 * The UI-facing surface shared by the real Baileys-backed service and the fake
 * used in end-to-end tests. Keeping this explicit lets the main process swap
 * implementations behind an env flag without the renderer noticing.
 */
export interface WhatsAppController {
  on<E extends keyof WhatsAppEvents>(event: E, listener: WhatsAppEvents[E]): this
  getStatus(): ConnectionStatus
  connect(): Promise<ConnectionStatus>
  logout(): Promise<void>
  cancel(): void
  sendBulk(
    contacts: Contact[],
    renderMessage: (contact: Contact) => string,
    options: SendOptions
  ): Promise<SendResult[]>
}

const logger = pino({ level: process.env.YAWN_LOG_LEVEL ?? 'silent' })

/**
 * Wraps a Baileys socket and exposes a small, UI-friendly surface: connect,
 * logout, and a cancellable bulk-send loop with progress events.
 */
export class WhatsAppService extends EventEmitter implements WhatsAppController {
  private sock: WASocket | null = null
  private status: ConnectionStatus = 'disconnected'
  private cancelRequested = false
  private sending = false

  constructor(private readonly authDir: string) {
    super()
  }

  // Typed event helpers --------------------------------------------------
  override on<E extends keyof WhatsAppEvents>(
    event: E,
    listener: WhatsAppEvents[E]
  ): this {
    return super.on(event, listener)
  }
  private fire<E extends keyof WhatsAppEvents>(
    event: E,
    ...args: Parameters<WhatsAppEvents[E]>
  ): void {
    this.emit(event, ...args)
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status
    this.fire('status', status)
  }

  /** Open a socket and begin the pairing / connection flow. */
  async connect(): Promise<ConnectionStatus> {
    if (this.status === 'connected') return this.status
    this.setStatus('connecting')

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['Yawn', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false
    })
    this.sock = sock

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', (update) => {
      void this.handleConnectionUpdate(update)
    })

    return this.status
  }

  private async handleConnectionUpdate(update: {
    connection?: string
    lastDisconnect?: { error?: Error }
    qr?: string
  }): Promise<void> {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      this.setStatus('qr')
      try {
        const dataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 })
        this.fire('qr', dataUrl)
      } catch (err) {
        logger.error({ err }, 'failed to render QR')
      }
    }

    if (connection === 'open') {
      this.setStatus('connected')
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })
        ?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut
      if (loggedOut) {
        this.setStatus('logged-out')
        this.sock = null
      } else {
        // Transient disconnect — attempt to reconnect.
        this.setStatus('connecting')
        await this.connect()
      }
    }
  }

  /** Log out, invalidating the stored session. */
  async logout(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout()
      } catch {
        // ignore — we tear down regardless
      }
      this.sock = null
    }
    this.setStatus('logged-out')
  }

  /** Request cancellation of an in-flight bulk send. */
  cancel(): void {
    if (this.sending) this.cancelRequested = true
  }

  /**
   * Send `template` (rendered per-contact by the caller) to every contact,
   * pacing between messages and emitting progress. Returns the per-contact
   * results once finished or cancelled.
   */
  async sendBulk(
    contacts: Contact[],
    renderMessage: (contact: Contact) => string,
    options: SendOptions
  ): Promise<SendResult[]> {
    if (!this.sock || this.status !== 'connected') {
      throw new Error('WhatsApp is not connected')
    }
    if (this.sending) {
      throw new Error('A send is already in progress')
    }

    this.sending = true
    this.cancelRequested = false
    const results: SendResult[] = []
    const progress: SendProgress = {
      total: contacts.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      done: false
    }

    try {
      for (let i = 0; i < contacts.length; i++) {
        if (this.cancelRequested) {
          for (let j = i; j < contacts.length; j++) {
            results.push({ contact: contacts[j], status: 'skipped', at: Date.now() })
            progress.skipped++
          }
          break
        }

        const contact = contacts[i]
        progress.current = contact
        this.fire('progress', { ...progress })

        const result = await this.sendOne(contact, renderMessage(contact))
        results.push(result)
        if (result.status === 'sent') progress.sent++
        else if (result.status === 'failed') progress.failed++
        else progress.skipped++

        this.fire('progress', { ...progress })

        // Pace between messages (but not after the last one).
        if (i < contacts.length - 1 && !this.cancelRequested) {
          await sleep(nextDelay(options))
        }
      }
    } finally {
      progress.done = true
      progress.current = undefined
      this.fire('progress', { ...progress })
      this.fire('complete', results)
      this.sending = false
      this.cancelRequested = false
    }

    return results
  }

  private async sendOne(contact: Contact, message: string): Promise<SendResult> {
    const at = Date.now()
    if (!contact.phone) {
      return { contact, status: 'skipped', error: 'No phone number', at }
    }
    const jid = toJid(contact.phone)
    try {
      const results = (await this.sock!.onWhatsApp(jid)) ?? []
      const check = results[0]
      if (!check?.exists) {
        return { contact, status: 'failed', error: 'Not on WhatsApp', at }
      }
      await this.sock!.sendMessage(check.jid, { text: message })
      return { contact, status: 'sent', at }
    } catch (err) {
      return {
        contact,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        at
      }
    }
  }
}
