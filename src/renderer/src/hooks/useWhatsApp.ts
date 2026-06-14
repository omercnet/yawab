import type { ConnectionStatus } from '@shared/types'
import { useEffect, useState } from 'react'

export interface WhatsAppState {
  status: ConnectionStatus
  qr: string | null
  connect: () => Promise<void>
  logout: () => Promise<void>
}

/** Subscribes to connection status + QR pushes from the main process. */
export function useWhatsApp(): WhatsAppState {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    window.api.getStatus().then((s) => {
      if (active) setStatus(s)
    })

    const offStatus = window.api.onStatus((s) => {
      setStatus(s)
      if (s === 'connected') setQr(null)
    })
    const offQr = window.api.onQr((dataUrl) => setQr(dataUrl))

    return () => {
      active = false
      offStatus()
      offQr()
    }
  }, [])

  return {
    status,
    qr,
    connect: async () => {
      await window.api.connect()
    },
    logout: async () => {
      await window.api.logout()
      setQr(null)
    }
  }
}
