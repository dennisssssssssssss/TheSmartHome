import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { getNotificationsEnabled, setNotificationsEnabled, subscribeToPreferenceChanges } from '@/lib/preferences'
import type { Notification } from '@/types'
import { Bell, BellOff, Info, AlertTriangle, Shield, Trash2 } from 'lucide-react'
import { useSignalR } from '@/hooks/useSignalR'
import { toast } from 'sonner'
import { useI18n } from '@/context/I18nContext'

export const Notifications: React.FC = () => {
  const { locale, formatDateTime } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabledState] = useState(getNotificationsEnabled)

  const fetchNotifications = useCallback(async () => {
    if (!getNotificationsEnabled()) {
      setNotifications([])
      return
    }

    try {
      const data = await api.notifications.getAll()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  useSignalR({ onNotificationUpdated: notificationsEnabled ? fetchNotifications : undefined })

  useEffect(() => {
    const unsubscribe = subscribeToPreferenceChanges(() => {
      setNotificationsEnabledState(getNotificationsEnabled())
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications, notificationsEnabled])

  const unreadCount = notifications.filter(n => !n.read).length

  const getTypeLabel = (type: string) => {
    if (type === 'alert') return locale === 'ro' ? 'Alerta' : 'Alert'
    if (type === 'warning') return locale === 'ro' ? 'Avertizare' : 'Warning'
    return 'Info'
  }

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {
      toast.error(locale === 'ro' ? 'Nu am putut marca notificarea ca citita' : 'Could not mark the notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {
      toast.error(locale === 'ro' ? 'Nu am putut marca toate notificarile ca citite' : 'Could not mark all notifications as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await api.notifications.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success(locale === 'ro' ? 'Notificarea a fost stearsa' : 'Notification deleted')
    } catch {
      toast.error(locale === 'ro' ? 'Nu am putut sterge notificarea' : 'Could not delete the notification')
    }
  }

  const getIcon = (type: string) => {
    if (type === 'alert') return AlertTriangle
    if (type === 'warning') return Shield
    return Info
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-gold section-label">{locale === 'ro' ? 'Se incarca...' : 'Loading...'}</div></div>
  }

  if (!notificationsEnabled) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="section-label mb-2">NOTIFICATIONS</div>
          <h1 className="page-title">{locale === 'ro' ? 'Notificari puse pe pauza.' : 'Notifications paused.'}</h1>
        </div>

        <Card className="luxury-card p-12 text-center">
          <BellOff className="size-16 text-muted-foreground mx-auto mb-4" />
          <p className="font-display text-2xl text-foreground mb-2">
            {locale === 'ro' ? 'Alertele sunt dezactivate pentru acest browser.' : 'Alerts are disabled for this browser.'}
          </p>
          <p className="font-body text-sm text-muted-foreground mb-6">
            {locale === 'ro'
              ? 'Reactiveaza notificarile pentru a readuce badge-ul, actualizarile live si aceasta lista.'
              : 'Re-enable notifications to restore the badge, live updates, and this list.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setNotificationsEnabled(true)}
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {locale === 'ro' ? 'Activeaza notificarile' : 'Enable notifications'}
            </Button>
            <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold/10 uppercase tracking-wider">
              <Link to="/app/settings">{locale === 'ro' ? 'Deschide setarile' : 'Open settings'}</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="section-label mb-2">NOTIFICATIONS</div>
          <h1 className="page-title">
            {locale === 'ro' ? 'Actualizari.' : 'Updates.'} {unreadCount > 0 && (
              <span className="text-gold">({unreadCount} {locale === 'ro' ? 'necitite' : 'unread'})</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="border-gold text-gold hover:bg-gold/10 uppercase tracking-wider text-xs">
            {locale === 'ro' ? 'Marcheaza tot ca citit' : 'Mark all as read'}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => {
          const Icon = getIcon(notification.type)
          return (
            <Card
              key={notification.id}
              className={`luxury-card p-6 ${notification.read ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded border"
                  style={{
                    borderColor: notification.type === 'alert' ? '#8B3A3A' : 'rgba(201, 168, 76, 0.3)',
                    backgroundColor: notification.type === 'alert' ? 'rgba(139, 58, 58, 0.1)' : 'rgba(201, 168, 76, 0.06)',
                  }}
                >
                  <Icon className={`size-6 ${notification.type === 'alert' ? 'text-destructive' : 'text-gold'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="card-title text-foreground">{notification.title}</h3>
                    {!notification.read && (
                      <div className="size-2 rounded-full bg-gold" />
                    )}
                  </div>
                  <p className="font-body text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center gap-4">
                    <span className="section-label text-xs">
                      {formatDateTime(notification.created_at)}
                    </span>
                    <Badge variant="outline" className="border-gold text-gold uppercase text-xs">
                      {getTypeLabel(notification.type)}
                    </Badge>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-gold hover:text-gold-light text-xs h-auto py-1 px-2"
                      >
                        {locale === 'ro' ? 'Marcheaza ca citita' : 'Mark as read'}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-muted-foreground hover:text-destructive text-xs h-auto py-1 px-2"
                    >
                      <Trash2 className="mr-1 size-3" />
                      {locale === 'ro' ? 'Sterge' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {notifications.length === 0 && (
        <Card className="luxury-card p-12 text-center">
          <Bell className="size-16 text-muted-foreground mx-auto mb-4" />
          <p className="font-display text-2xl text-muted-foreground mb-2">
            {locale === 'ro' ? 'Nu exista notificari.' : 'No notifications.'}
          </p>
          <p className="font-body text-sm text-muted-foreground">
            {locale === 'ro' ? 'Esti la zi cu toate actualizarile.' : "You're all caught up."}
          </p>
        </Card>
      )}
    </div>
  )
}
