import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  KeyRound,
  LogOut,
  Menu,
  MoonStar,
  Search,
  Settings,
  SunMedium,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { api } from '@/lib/api'
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  subscribeToPreferenceChanges,
} from '@/lib/preferences'
import type { Notification } from '@/types'
import { useSignalR } from '@/hooks/useSignalR'
import { useSearch } from '@/context/SearchContext'
import { useI18n } from '@/context/I18nContext'
import { getShellContent } from '@/lib/i18n/content'

interface TopBarProps {
  onToggleSidebar: () => void
  isCollapsed: boolean
  isDesktop: boolean
}

const PREVIEW_LIMIT = 5

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, isCollapsed, isDesktop }) => {
  const { username, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { locale, formatRelativeTime } = useI18n()
  const shellContent = getShellContent(locale)
  const navigate = useNavigate()
  const location = useLocation()
  const { searchQuery, setSearchQuery } = useSearch()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsEnabled, setNotificationsEnabledState] = useState(getNotificationsEnabled)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)

  const copy = locale === 'ro'
    ? {
        notificationsTitle: 'Notificări',
        notificationsEmpty: 'Nu ai nimic urgent acum.',
        notificationsHint: 'Totul este la zi. Vezi istoricul complet doar când ai nevoie.',
        notificationsPausedTitle: 'Notificările sunt puse pe pauză',
        notificationsPausedBody: 'Le poți reactiva direct de aici pentru badge, actualizări live și inbox rapid.',
        enableNotifications: 'Activează',
        markAllAsRead: 'Marchează tot',
        markAsRead: 'Citit',
        deleteNotification: 'Șterge',
        viewAllNotifications: 'Vezi tot istoricul',
        accountReady: 'Cont activ',
        openSettings: 'Setări aplicație',
        changePassword: 'Schimbă parola',
        appearance: 'Schimbă tema',
        signOut: shellContent.signOut,
        openProfile: 'Deschide profilul',
        openSearch: 'Deschide căutarea',
        closeSearch: 'Închide căutarea',
        quickAccess: 'Acces rapid',
      }
    : {
        notificationsTitle: 'Notifications',
        notificationsEmpty: 'Nothing urgent right now.',
        notificationsHint: 'You are all caught up. Open the full history only when you need it.',
        notificationsPausedTitle: 'Notifications are paused',
        notificationsPausedBody: 'You can re-enable them here for badges, live updates, and the quick inbox.',
        enableNotifications: 'Enable',
        markAllAsRead: 'Mark all',
        markAsRead: 'Mark read',
        deleteNotification: 'Delete',
        viewAllNotifications: 'View full history',
        accountReady: 'Account active',
        openSettings: 'App settings',
        changePassword: 'Change password',
        appearance: 'Toggle theme',
        signOut: shellContent.signOut,
        openProfile: 'Open profile menu',
        openSearch: 'Open search',
        closeSearch: 'Close search',
        quickAccess: 'Quick access',
      }

  const closeMenus = useCallback(() => {
    setIsNotificationsOpen(false)
    setIsProfileOpen(false)
  }, [])

  const emitNotificationsUpdated = () => {
    window.dispatchEvent(new Event('notifications-updated'))
  }

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
      setNotificationsEnabledState(getNotificationsEnabled())
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([])
      setIsNotificationsOpen(false)
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

  useEffect(() => {
    closeMenus()
    setIsMobileSearchOpen(false)
  }, [location.pathname, closeMenus])

  useEffect(() => {
    if (isDesktop) {
      setIsMobileSearchOpen(false)
    }
  }, [isDesktop])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      const insideNotifications = notificationsRef.current?.contains(target)
      const insideProfile = profileRef.current?.contains(target)

      if (insideNotifications || insideProfile) {
        return
      }

      closeMenus()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenus()
        setIsMobileSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closeMenus])

  const unreadCount = notificationsEnabled ? notifications.filter((notification) => !notification.read).length : 0
  const NotificationIcon = notificationsEnabled ? Bell : BellOff
  const recentNotifications = useMemo(
    () =>
      [...notifications]
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
        .slice(0, PREVIEW_LIMIT),
    [notifications],
  )

  const getInitials = (name: string | null) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((segment) => segment[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEnableNotifications = () => {
    setNotificationsEnabled(true)
    setNotificationsEnabledState(true)
    refreshNotifications()
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id)
      setNotifications((previous) => previous.map((notification) => (
        notification.id === id ? { ...notification, read: true } : notification
      )))
      emitNotificationsUpdated()
    } catch {
      toast.error(locale === 'ro' ? 'Nu am putut actualiza notificarea' : 'Could not update the notification')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      setNotifications((previous) => previous.map((notification) => ({ ...notification, read: true })))
      emitNotificationsUpdated()
    } catch {
      toast.error(locale === 'ro' ? 'Nu am putut marca toate notificările' : 'Could not mark all notifications')
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await api.notifications.delete(id)
      setNotifications((previous) => previous.filter((notification) => notification.id !== id))
      emitNotificationsUpdated()
    } catch {
      toast.error(locale === 'ro' ? 'Nu am putut șterge notificarea' : 'Could not delete the notification')
    }
  }

  const handleOpenSettings = () => {
    closeMenus()
    navigate('/app/settings')
  }

  const handleOpenChangePassword = () => {
    closeMenus()
    navigate('/app/settings?changePassword=1')
  }

  const handleOpenNotificationsPage = () => {
    closeMenus()
    navigate('/app/notifications')
  }

  const handleSignOut = () => {
    closeMenus()
    logout()
    navigate('/')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const panelStyle = {
    width: 'min(24rem, calc(100vw - 1rem))',
  } as const

  return (
    <div
      className={`fixed top-0 z-20 border-b bg-background transition-all duration-300 ${
        isDesktop
          ? isCollapsed
            ? 'left-14'
            : 'left-60'
          : 'left-0 right-0'
      }`}
      style={{
        borderColor: 'rgba(201, 168, 76, 0.08)',
        width: isDesktop ? (isCollapsed ? 'calc(100% - 3.5rem)' : 'calc(100% - 15rem)') : '100%',
      }}
    >
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="shrink-0 text-muted-foreground hover:text-gold"
          >
            <Menu className="size-5" />
          </Button>

          {isDesktop ? (
            <div className="relative max-w-2xl flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={shellContent.topBar.searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 border-gold-muted bg-background pl-10 font-body focus:border-gold"
              />
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-foreground">NEXUS HOME</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {!isDesktop && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsMobileSearchOpen((current) => !current)
                closeMenus()
              }}
              className="text-muted-foreground hover:text-gold"
              aria-label={isMobileSearchOpen ? copy.closeSearch : copy.openSearch}
              title={isMobileSearchOpen ? copy.closeSearch : copy.openSearch}
            >
              {isMobileSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </Button>
          )}

          <div className="hidden xl:flex items-center gap-2 rounded-full border border-gold/10 px-3 py-1.5">
            <div className={`size-2 rounded-full ${isSignalRConnected ? 'bg-gold' : 'bg-muted'}`} />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {isSignalRConnected ? shellContent.topBar.connected : shellContent.topBar.disconnected}
            </span>
          </div>

          <div ref={notificationsRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsNotificationsOpen((current) => !current)
                setIsProfileOpen(false)
                setIsMobileSearchOpen(false)
              }}
              className={`relative ${isNotificationsOpen ? 'text-gold' : 'text-muted-foreground hover:text-gold'}`}
              aria-label={notificationsEnabled ? shellContent.topBar.openNotifications : shellContent.topBar.notificationsPaused}
              title={notificationsEnabled ? shellContent.topBar.openNotifications : shellContent.topBar.notificationsPaused}
            >
              <NotificationIcon className="size-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center bg-gold p-0 text-xs text-background">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {isNotificationsOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-3 overflow-hidden rounded-2xl border bg-background shadow-2xl"
                style={{ ...panelStyle, borderColor: 'rgba(201, 168, 76, 0.18)' }}
              >
                <div className="border-b px-4 py-4" style={{ borderColor: 'rgba(201, 168, 76, 0.12)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="section-label mb-1">INBOX</p>
                      <h3 className="font-display text-xl text-foreground">{copy.notificationsTitle}</h3>
                    </div>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-gold hover:text-gold-light"
                      >
                        <CheckCheck className="mr-2 size-4" />
                        {copy.markAllAsRead}
                      </Button>
                    )}
                  </div>
                </div>

                {!notificationsEnabled ? (
                  <div className="px-4 py-5">
                    <p className="mb-2 font-display text-lg text-foreground">{copy.notificationsPausedTitle}</p>
                    <p className="mb-4 font-body text-sm text-muted-foreground">{copy.notificationsPausedBody}</p>
                    <Button onClick={handleEnableNotifications} className="bg-gold text-background hover:bg-gold-light">
                      {copy.enableNotifications}
                    </Button>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="mx-auto mb-3 size-10 text-muted-foreground" />
                    <p className="mb-2 font-display text-xl text-foreground">{copy.notificationsEmpty}</p>
                    <p className="font-body text-sm text-muted-foreground">{copy.notificationsHint}</p>
                  </div>
                ) : (
                  <div className="max-h-[24rem] overflow-y-auto">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border-b px-4 py-4 last:border-b-0"
                        style={{ borderColor: 'rgba(201, 168, 76, 0.08)' }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">{notification.title}</p>
                              {!notification.read && <span className="size-2 rounded-full bg-gold" />}
                            </div>
                            <p className="line-clamp-2 text-sm text-muted-foreground">{notification.message}</p>
                            <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="h-8 px-2 text-gold hover:text-gold-light"
                              >
                                {copy.markAsRead}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="size-8 text-muted-foreground hover:text-destructive"
                              aria-label={copy.deleteNotification}
                              title={copy.deleteNotification}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: 'rgba(201, 168, 76, 0.12)' }}>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{copy.quickAccess}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenNotificationsPage}
                    className="text-gold hover:text-gold-light"
                  >
                    {copy.viewAllNotifications}
                    <ExternalLink className="ml-2 size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((current) => !current)
                setIsNotificationsOpen(false)
                setIsMobileSearchOpen(false)
              }}
              aria-label={copy.openProfile}
              title={copy.openProfile}
              className={`flex items-center gap-2 rounded-full border bg-background px-2 py-1 text-gold transition-colors ${
                isProfileOpen ? 'border-gold-light' : 'hover:border-gold-light'
              }`}
              style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
            >
              <span className="flex size-8 items-center justify-center rounded-full border border-gold/30 text-sm font-body">
                {getInitials(username)}
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
            </button>

            {isProfileOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-3 w-[18rem] overflow-hidden rounded-2xl border bg-background shadow-2xl"
                style={{ borderColor: 'rgba(201, 168, 76, 0.18)' }}
              >
                <div className="border-b px-4 py-4" style={{ borderColor: 'rgba(201, 168, 76, 0.12)' }}>
                  <p className="section-label mb-1">ACCOUNT</p>
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                      <span className="text-sm font-body">{getInitials(username)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{username || 'admin'}</p>
                      <p className="text-sm text-muted-foreground">{copy.accountReady}</p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-sidebar-accent/60"
                  >
                    <Settings className="size-4 text-gold" />
                    <span>{copy.openSettings}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenChangePassword}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-sidebar-accent/60"
                  >
                    <KeyRound className="size-4 text-gold" />
                    <span>{copy.changePassword}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-sidebar-accent/60"
                  >
                    {theme === 'dark' ? <SunMedium className="size-4 text-gold" /> : <MoonStar className="size-4 text-gold" />}
                    <span>{copy.appearance}</span>
                  </button>
                </div>

                <div className="border-t px-2 py-2" style={{ borderColor: 'rgba(201, 168, 76, 0.12)' }}>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    <span>{copy.signOut}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isDesktop && isMobileSearchOpen && (
        <div className="border-t px-4 py-3 sm:px-6" style={{ borderColor: 'rgba(201, 168, 76, 0.08)' }}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={shellContent.topBar.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 border-gold-muted bg-background pl-10 font-body focus:border-gold"
            />
          </div>
        </div>
      )}
    </div>
  )
}
