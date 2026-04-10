import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, BellOff, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { getNotificationsEnabled, subscribeToPreferenceChanges } from '@/lib/preferences'
import type { Notification } from '@/types'
import { useSignalR } from '@/hooks/useSignalR'
import { useSearch } from '@/context/SearchContext'
import { useI18n } from '@/context/I18nContext'
import { getShellContent } from '@/lib/i18n/content'

interface TopBarProps {
  onToggleSidebar: () => void
  isCollapsed: boolean
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, isCollapsed }) => {
  const { username } = useAuth()
  const { locale } = useI18n()
  const shellContent = getShellContent(locale)
  const navigate = useNavigate()
  const location = useLocation()
  const { searchQuery, setSearchQuery } = useSearch()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(getNotificationsEnabled)

  const refreshNotifications = useCallback(() => {
    if (!getNotificationsEnabled()) {
      setNotifications([])
      return
    }

    api.notifications.getAll().then(setNotifications).catch(console.error)
  }, [])

  const { connected: isSignalRConnected } = useSignalR({
    onNotificationUpdated: notificationsEnabled ? refreshNotifications : undefined,
  })

  useEffect(() => {
    const unsubscribe = subscribeToPreferenceChanges(() => {
      setNotificationsEnabled(getNotificationsEnabled())
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([])
      return
    }

    refreshNotifications()
  }, [notificationsEnabled, refreshNotifications])

  useEffect(() => {
    if (!notificationsEnabled) {
      return () => undefined
    }

    const handler = () => refreshNotifications()
    window.addEventListener('notifications-updated', handler)
    return () => window.removeEventListener('notifications-updated', handler)
  }, [notificationsEnabled, refreshNotifications])

  const unreadCount = notificationsEnabled ? notifications.filter((n) => !n.read).length : 0
  const isNotificationsPage = location.pathname === '/app/notifications'
  const isSettingsPage = location.pathname === '/app/settings'
  const NotificationIcon = notificationsEnabled ? Bell : BellOff

  const getInitials = (name: string | null) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={`fixed top-0 h-16 bg-background border-b flex items-center justify-between px-6 transition-all duration-600 ${
        isCollapsed ? 'left-14' : 'left-60'
      }`}
      style={{
        borderColor: 'rgba(201, 168, 76, 0.08)',
        width: isCollapsed ? 'calc(100% - 3.5rem)' : 'calc(100% - 15rem)',
      }}
    >
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="shrink-0 text-muted-foreground hover:text-gold"
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={shellContent.topBar.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-background border-gold-muted focus:border-gold font-body"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`size-2 rounded-full transition-colors ${
              isSignalRConnected ? 'bg-gold' : 'bg-muted'
            }`}
          />
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-body">
            {isSignalRConnected ? shellContent.topBar.connected : shellContent.topBar.disconnected}
          </span>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app/notifications')}
            className={`relative ${isNotificationsPage ? 'text-gold' : 'text-muted-foreground hover:text-gold'}`}
            aria-label={notificationsEnabled ? shellContent.topBar.openNotifications : shellContent.topBar.notificationsPaused}
            title={notificationsEnabled ? shellContent.topBar.openNotifications : shellContent.topBar.notificationsPaused}
          >
            <NotificationIcon className="size-5" />
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-xs bg-gold text-background"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/settings')}
          aria-label={shellContent.topBar.openSettings}
          title={shellContent.topBar.openSettings}
          className={`flex size-10 items-center justify-center rounded-full border text-gold bg-background transition-colors ${
            isSettingsPage ? 'border-gold-light' : 'hover:border-gold-light'
          }`}
          style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
        >
          <span className="text-sm font-body">{getInitials(username)}</span>
        </button>
      </div>
    </div>
  )
}
