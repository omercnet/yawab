import { EventEmitter } from 'node:events'
import type {
  ConnectionStatus,
  Contact,
  SendOptions,
  SendProgress,
  SendResult
} from '@shared/types'
import type { WhatsAppController, WhatsAppEvents } from './whatsapp'

/**
 * A deterministic, network-free stand-in for {@link WhatsAppService}, activated
 * via the `YAWAB_FAKE_WA` env flag. It mimics the pairing handshake and bulk-send
 * progress so end-to-end tests can drive the full UI/IPC flow without a real
 * WhatsApp account. A single configurable number is reported as "not on
 * WhatsApp" so the failure path stays covered.
 */
export class FakeWhatsAppService extends EventEmitter implements WhatsAppController {
  private status: ConnectionStatus = 'disconnected'
  private cancelRequested = false

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

  connect(): Promise<ConnectionStatus> {
    this.setStatus('connecting')
    // A 1x1 transparent PNG stands in for the rendered QR image.
    const qr =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC'
    setTimeout(() => this.fire('qr', qr), 30)
    setTimeout(() => this.setStatus('connected'), 120)
    return Promise.resolve(this.status)
  }

  logout(): Promise<void> {
    this.setStatus('logged-out')
    return Promise.resolve()
  }

  cancel(): void {
    this.cancelRequested = true
  }

  async sendBulk(
    contacts: Contact[],
    _renderMessage: (contact: Contact) => string,
    _options: SendOptions
  ): Promise<SendResult[]> {
    this.cancelRequested = false
    const results: SendResult[] = []
    const progress: SendProgress = {
      total: contacts.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      done: false
    }

    for (const contact of contacts) {
      if (this.cancelRequested) {
        results.push({ contact, status: 'skipped', at: Date.now() })
        progress.skipped++
        continue
      }
      progress.current = contact
      this.fire('progress', { ...progress })

      // Numbers ending in "0000" simulate a recipient not on WhatsApp.
      const failed = contact.phone?.endsWith('0000') ?? false
      results.push({
        contact,
        status: failed ? 'failed' : 'sent',
        error: failed ? 'Not on WhatsApp' : undefined,
        at: Date.now()
      })
      if (failed) progress.failed++
      else progress.sent++
      this.fire('progress', { ...progress })
      await delay(15)
    }

    progress.done = true
    progress.current = undefined
    this.fire('progress', { ...progress })
    this.fire('complete', results)
    return results
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status
    this.fire('status', status)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
