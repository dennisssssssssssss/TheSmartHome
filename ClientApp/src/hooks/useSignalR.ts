import { useEffect, useRef, useState } from 'react'
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'
import { API_BASE } from '@/lib/api'

interface UseSignalROptions {
  onUpdate?: () => void
  onLog?: (log: unknown) => void
  onNotificationUpdated?: () => void
}

export function useSignalR({ onUpdate, onLog, onNotificationUpdated }: UseSignalROptions = {}) {
  const [connected, setConnected] = useState(false)
  const connectionRef = useRef<HubConnection | null>(null)
  const onUpdateRef = useRef<typeof onUpdate>(onUpdate)
  const onLogRef = useRef<typeof onLog>(onLog)
  const onNotificationUpdatedRef = useRef<typeof onNotificationUpdated>(onNotificationUpdated)

  useEffect(() => {
    onUpdateRef.current = onUpdate
    onLogRef.current = onLog
    onNotificationUpdatedRef.current = onNotificationUpdated
  }, [onUpdate, onLog, onNotificationUpdated])

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/smarthome`, {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connectionRef.current = connection

    connection.on('UpdateUI', () => {
      onUpdateRef.current?.()
    })

    connection.on('ReceiveLog', (log: unknown) => {
      onLogRef.current?.(log)
    })

    connection.on('NotificationUpdated', () => {
      onNotificationUpdatedRef.current?.()
    })

    connection.onreconnected(() => setConnected(true))
    connection.onclose(() => setConnected(false))

    connection
      .start()
      .then(() => setConnected(true))
      .catch((err) => {
        console.error('SignalR connection failed:', err)
        setConnected(false)
      })

    return () => {
      connection.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
