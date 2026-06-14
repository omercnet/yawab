import { EventEmitter } from 'node:events'
import { toJid } from '@shared/phone'
import type { ConnectionSettings } from '@shared/settings'
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
  configure(config: ConnectionSettings): void
  connect(): Promise<ConnectionStatus>
  logout(): Promise<void>
  cancel(): void
  sendBulk(
    contacts: Contact[],
    renderMessage: (contact: Contact) => string,
    options: SendOptions
  ): Promise<SendResult[]>
}

const logger = pino({ level: process.env.YAWAB_LOG_LEVEL ?? 'silent' })

/**
 * Wraps a Baileys socket and exposes a small, UI-friendly surface: connect,
 * logout, and a cancellable bulk-send loop with progress events.
 */
export class WhatsAppService extends EventEmitter implements WhatsAppController {
  private sock: WASocket | null = null
  private status: ConnectionStatus = 'disconnected'
  private cancelRequested = false
  private sending = false
  private simulateTyping = false
  private connectionConfig: ConnectionSettings = {
    appearOnline: false,
    autoReconnect: true
  }

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

  /** Apply connection preferences (presence + reconnect) before connecting. */
  configure(config: ConnectionSettings): void {
    this.connectionConfig = { ...config }
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
      browser: ['Yawab', 'Chrome', '1.0.0'],
      markOnlineOnConnect: this.connectionConfig.appearOnline
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
      } else if (this.connectionConfig.autoReconnect) {
        // Transient disconnect — attempt to reconnect.
        this.setStatus('connecting')
        await this.connect()
      } else {
        this.setStatus('disconnected')
        this.sock = null
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
    this.simulateTyping = options.simulateTyping ?? false

    // Optionally shuffle, then apply the per-run cap. Capped-out contacts are
    // reported as skipped so the totals still add up.
    const ordered = options.randomizeOrder ? shuffle(contacts) : contacts.slice()
    const cap =
      options.perRunCap && options.perRunCap > 0
        ? Math.min(options.perRunCap, ordered.length)
        : ordered.length
    const targets = ordered.slice(0, cap)
    const overflow = ordered.slice(cap)

    const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : 0
    const stopAfterFailures =
      options.stopAfterFailures && options.stopAfterFailures > 0
        ? options.stopAfterFailures
        : 0

    const results: SendResult[] = []
    const progress: SendProgress = {
      total: contacts.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      done: false
    }

    const skipRest = (from: number, error?: string): void => {
      for (let j = from; j < targets.length; j++) {
        results.push({ contact: targets[j], status: 'skipped', error, at: Date.now() })
        progress.skipped++
      }
    }

    try {
      let consecutiveFailures = 0
      let sentSinceBatch = 0

      for (let i = 0; i < targets.length; i++) {
        if (this.cancelRequested) {
          skipRest(i)
          break
        }

        const contact = targets[i]
        progress.current = contact
        this.fire('progress', { ...progress })

        const result = await this.sendOne(contact, renderMessage(contact))
        results.push(result)
        if (result.status === 'sent') {
          progress.sent++
          consecutiveFailures = 0
          sentSinceBatch++
        } else if (result.status === 'failed') {
          progress.failed++
          consecutiveFailures++
        } else {
          progress.skipped++
        }

        this.fire('progress', { ...progress })

        // Circuit-breaker: many failures in a row usually means a block.
        if (stopAfterFailures && consecutiveFailures >= stopAfterFailures) {
          skipRest(i + 1, 'Aborted after repeated failures')
          break
        }

        const isLast = i === targets.length - 1
        if (!isLast && !this.cancelRequested) {
          if (batchSize && sentSinceBatch >= batchSize) {
            sentSinceBatch = 0
            await sleep(Math.max(0, options.batchPauseMs ?? 0))
          } else {
            await sleep(nextDelay(options))
          }
        }
      }

      // Contacts beyond the per-run cap are always reported as skipped.
      for (const contact of overflow) {
        results.push({
          contact,
          status: 'skipped',
          error: 'Per-run cap reached',
          at: Date.now()
        })
        progress.skipped++
      }
    } finally {
      progress.done = true
      progress.current = undefined
      this.fire('progress', { ...progress })
      this.fire('complete', results)
      this.sending = false
      this.cancelRequested = false
      this.simulateTyping = false
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
      if (this.simulateTyping) {
        try {
          await this.sock!.sendPresenceUpdate('composing', check.jid)
          await sleep(1200)
          await this.sock!.sendPresenceUpdate('paused', check.jid)
        } catch {
          // Presence updates are best-effort; ignore failures.
        }
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

/** Fisher–Yates shuffle returning a new array (does not mutate the input). */
function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
