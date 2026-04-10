import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { AUTO_LOCK_HOUR, AUTO_LOCK_MINUTE, isAutoLockRule } from '@/lib/security'
import { getSecurityMode, setSecurityMode, type SecurityMode } from '@/lib/preferences'
import type { Automation, Device, ActivityLog, Notification } from '@/types'
import { AlertTriangle, BellRing, Camera, Home, Lock, MoonStar, Shield, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useSignalR } from '@/hooks/useSignalR'
import { useI18n } from '@/context/I18nContext'

type SecurityEvent = {
  id: string
  title: string
  details: string
  createdAt: string
  type: 'alert' | 'warning' | 'info' | 'activity'
}

const SECURITY_KEYWORDS = ['lock', 'door', 'security', 'sensor', 'camera', 'motion', 'alarm']
const QUIET_DEVICE_TYPES: Device['type'][] = ['bulb', 'tv', 'speaker']

const SECURITY_COPY = {
  ro: {
    errors: {
      load: 'Nu am putut incarca datele de securitate',
      lockAll: 'Nu am putut securiza toate incuietorile',
      mode: 'Nu am putut aplica modul de securitate',
    },
    success: {
      lockAll: 'Toate incuietorile au fost securizate',
      lockAllDone: 'Toate incuietorile sunt deja securizate',
      modeApplied: 'Modul de securitate a fost aplicat',
    },
    page: {
      eyebrow: 'SECURITY',
      title: 'Siguranta locuintei tale.',
      lockAll: 'Incuie toate usile',
      locking: 'Se securizeaza...',
      manageAutoLock: 'Administreaza Auto-Lock',
      loading: 'Se incarca...',
    },
    status: {
      alert: 'Alerta',
      ready: 'Pregatit',
      secured: 'Securizat',
      monitoring: 'Monitorizare',
      warning: 'Atentie',
      noDevices: 'Adauga o incuietoare sau o camera pentru a incepe monitorizarea',
      allSecured: 'Toate incuietorile detectate sunt securizate',
      monitoringLocks: (count: number) => `${count} incuietori sunt protejate prin auto-lock`,
      unsecured: 'Una sau mai multe incuietori sunt nesecurizate',
      alertsToday: (count: number) => `${count} alerte de securitate astazi`,
    },
    stats: {
      system: 'Stare sistem',
      locks: 'Incuietori',
      cameras: 'Camere',
      alerts: 'Alerte',
      securedLocks: (secured: number, total: number) => `${secured}/${total} securizate`,
      onlineCameras: (online: number, total: number) => `${online}/${total} online`,
      alertsToday: (count: number) => `${count} astazi`,
    },
    modes: {
      title: 'Moduri de securitate',
      home: {
        label: 'Acasa',
        description: 'Pastreaza incuietorile si camerele active, dar lasa senzorii de miscare relaxati.',
      },
      away: {
        label: 'Plecat',
        description: 'Securizeaza incuietorile, camerele si senzorii, apoi opreste dispozitivele de prezenta.',
      },
      night: {
        label: 'Noapte',
        description: 'Pregateste casa pentru noapte: incuietori active, senzori activi si luminile principale stinse.',
      },
      active: 'Mod activ',
      custom: 'Personalizat',
    },
    autoLock: {
      title: 'Auto-Lock',
      status: 'STATUS',
      nextRun: 'URMATOAREA RULARE',
      protectedDevices: 'DISPOZITIVE PROTEJATE',
      active: 'Activ',
      inactive: 'Inactiv',
      fallback: `Zilnic la ${String(AUTO_LOCK_HOUR).padStart(2, '0')}:${String(AUTO_LOCK_MINUTE).padStart(2, '0')} cand este activ`,
      coverage: (protectedCount: number, total: number) => `${protectedCount} din ${total} incuietori sunt acoperite`,
    },
    events: {
      title: 'Evenimente de securitate',
      empty: 'Nu exista evenimente de securitate recente',
      types: {
        alert: 'Alerta',
        warning: 'Avertizare',
        activity: 'Activitate',
        info: 'Info',
      },
    },
  },
  en: {
    errors: {
      load: 'Could not load security data',
      lockAll: 'Could not secure all lock devices',
      mode: 'Could not apply the security mode',
    },
    success: {
      lockAll: 'All lock devices were secured',
      lockAllDone: 'All lock devices are already secured',
      modeApplied: 'Security mode applied successfully',
    },
    page: {
      eyebrow: 'SECURITY',
      title: 'Your home safety.',
      lockAll: 'Lock all doors',
      locking: 'Securing...',
      manageAutoLock: 'Manage Auto-Lock',
      loading: 'Loading...',
    },
    status: {
      alert: 'Alert',
      ready: 'Ready',
      secured: 'Secured',
      monitoring: 'Monitoring',
      warning: 'Warning',
      noDevices: 'Add a lock or camera to start monitoring the space',
      allSecured: 'All detected lock devices are secured',
      monitoringLocks: (count: number) => `${count} lock devices are protected by auto-lock`,
      unsecured: 'One or more locks are unsecured',
      alertsToday: (count: number) => `${count} security alerts today`,
    },
    stats: {
      system: 'System status',
      locks: 'Locks',
      cameras: 'Cameras',
      alerts: 'Alerts',
      securedLocks: (secured: number, total: number) => `${secured}/${total} secured`,
      onlineCameras: (online: number, total: number) => `${online}/${total} online`,
      alertsToday: (count: number) => `${count} today`,
    },
    modes: {
      title: 'Security modes',
      home: {
        label: 'Home',
        description: 'Keep locks and cameras active while motion sensors stay relaxed.',
      },
      away: {
        label: 'Away',
        description: 'Secure locks, cameras, and sensors, then turn off presence devices.',
      },
      night: {
        label: 'Night',
        description: 'Prepare the home for night: locks active, sensors active, and the main lights off.',
      },
      active: 'Active mode',
      custom: 'Custom',
    },
    autoLock: {
      title: 'Auto-Lock',
      status: 'STATUS',
      nextRun: 'NEXT RUN',
      protectedDevices: 'PROTECTED DEVICES',
      active: 'Active',
      inactive: 'Inactive',
      fallback: `Daily at ${String(AUTO_LOCK_HOUR).padStart(2, '0')}:${String(AUTO_LOCK_MINUTE).padStart(2, '0')} when enabled`,
      coverage: (protectedCount: number, total: number) => `${protectedCount} of ${total} locks are covered`,
    },
    events: {
      title: 'Security events',
      empty: 'No recent security events',
      types: {
        alert: 'Alert',
        warning: 'Warning',
        activity: 'Activity',
        info: 'Info',
      },
    },
  },
} as const

function isSecurityNotification(notification: Notification): boolean {
  if (notification.type === 'alert' || notification.type === 'warning') {
    return true
  }

  const haystack = `${notification.title} ${notification.message}`.toLowerCase()
  return SECURITY_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

function isSameLocalDay(value: string, now = new Date()): boolean {
  const date = new Date(value)

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function getBadgeClass(type: SecurityEvent['type']) {
  if (type === 'alert') return 'border-destructive text-destructive'
  if (type === 'warning') return 'border-gold text-gold'
  if (type === 'activity') return 'border-muted text-muted-foreground'
  return 'border-gold text-gold'
}

export const Security: React.FC = () => {
  const { locale, formatDateTime, formatRelativeTime } = useI18n()
  const copy = SECURITY_COPY[locale]
  const [devices, setDevices] = useState<Device[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [isLockingDoors, setIsLockingDoors] = useState(false)
  const [isApplyingMode, setIsApplyingMode] = useState<SecurityMode | null>(null)
  const [activeMode, setActiveMode] = useState<SecurityMode>(getSecurityMode)

  const refreshData = useCallback(async () => {
    const [devicesData, logsData, notificationsData, automationsData] = await Promise.all([
      api.devices.getAll(),
      api.logs.getAll(),
      api.notifications.getAll(),
      api.automations.getAll(),
    ])

    setDevices(devicesData)
    setLogs(logsData)
    setNotifications(notificationsData)
    setAutomations(automationsData)
  }, [])

  useSignalR({
    onUpdate: refreshData,
    onNotificationUpdated: refreshData,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshData()
      } catch (error) {
        toast.error(copy.errors.load)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [copy.errors.load, refreshData])

  const locks = devices.filter((device) => device.type === 'lock')
  const locksSecured = locks.filter((device) => device.status).length
  const unsecuredLocks = locks.filter((device) => !device.status)
  const lockIds = new Set(locks.map((device) => device.id))
  const cameras = devices.filter((device) => device.type === 'camera')
  const camerasOnline = cameras.filter((device) => device.status).length
  const securityNotifications = notifications.filter(isSecurityNotification)
  const alertNotifications = securityNotifications.filter((notification) => notification.type === 'alert' || notification.type === 'warning')
  const alertsToday = alertNotifications.filter((notification) => isSameLocalDay(notification.created_at)).length
  const autoLockRules = automations.filter(isAutoLockRule)
  const activeAutoLockRules = autoLockRules.filter((rule) => rule.enabled && !!rule.device_id && lockIds.has(rule.device_id))
  const autoLockEnabled = activeAutoLockRules.length > 0
  const protectedLockIds = new Set(activeAutoLockRules.map((rule) => rule.device_id as string))
  const protectedLockCount = locks.filter((lock) => protectedLockIds.has(lock.id)).length
  const nextAutoLockRun = activeAutoLockRules.map((rule) => rule.trigger_value).filter(Boolean).sort()[0]
  const allLocksSecured = locks.length > 0 && locksSecured === locks.length

  const systemStatus = alertsToday > 0
    ? { label: copy.status.alert, color: 'text-destructive', detail: copy.status.alertsToday(alertsToday) }
    : locks.length === 0
      ? { label: copy.status.ready, color: 'text-muted-foreground', detail: copy.status.noDevices }
      : allLocksSecured
        ? { label: copy.status.secured, color: 'text-gold', detail: copy.status.allSecured }
        : autoLockEnabled
          ? { label: copy.status.monitoring, color: 'text-gold', detail: copy.status.monitoringLocks(protectedLockCount) }
          : { label: copy.status.warning, color: 'text-destructive', detail: copy.status.unsecured }

  const recentEvents = useMemo(() => {
    const securityLogs = logs
      .filter((log) => {
        const haystack = `${log.action} ${log.details}`.toLowerCase()
        return SECURITY_KEYWORDS.some((keyword) => haystack.includes(keyword))
      })
      .map<SecurityEvent>((log) => ({
        id: `log-${log.id}`,
        title: log.action,
        details: log.details,
        createdAt: log.created_at,
        type: 'activity',
      }))

    const securityNotificationEvents = securityNotifications.map<SecurityEvent>((notification) => ({
      id: `notification-${notification.id}`,
      title: notification.title,
      details: notification.message,
      createdAt: notification.created_at,
      type: notification.type,
    }))

    return [...securityNotificationEvents, ...securityLogs]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 8)
  }, [logs, securityNotifications])

  const handleLockAllDoors = async () => {
    if (unsecuredLocks.length === 0) {
      toast.success(copy.success.lockAllDone)
      return
    }

    setIsLockingDoors(true)

    try {
      await Promise.all(unsecuredLocks.map((device) => api.devices.control(device.id, { status: true })))
      toast.success(copy.success.lockAll)
      await refreshData()
    } catch (error) {
      toast.error(copy.errors.lockAll)
    } finally {
      setIsLockingDoors(false)
    }
  }

  const handleApplyMode = async (mode: SecurityMode) => {
    const securityDevices = devices.filter((device) => ['lock', 'camera', 'motion', 'door'].includes(device.type))
    const quietDevices = devices.filter((device) => QUIET_DEVICE_TYPES.includes(device.type))

    setIsApplyingMode(mode)

    try {
      const updates: Promise<unknown>[] = []

      for (const device of securityDevices) {
        const nextStatus = mode === 'home' && (device.type === 'motion' || device.type === 'door')
          ? false
          : true

        updates.push(api.devices.control(device.id, { status: nextStatus }))
      }

      if (mode === 'away' || mode === 'night') {
        for (const device of quietDevices) {
          updates.push(api.devices.control(device.id, { status: false }))
        }
      }

      await Promise.all(updates)
      setSecurityMode(mode)
      setActiveMode(mode)
      toast.success(copy.success.modeApplied)
      await refreshData()
    } catch (error) {
      toast.error(copy.errors.mode)
    } finally {
      setIsApplyingMode(null)
    }
  }

  const modeCards = [
    { key: 'home' as const, icon: Home, ...copy.modes.home },
    { key: 'away' as const, icon: ShieldCheck, ...copy.modes.away },
    { key: 'night' as const, icon: MoonStar, ...copy.modes.night },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-gold section-label">{copy.page.loading}</div></div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="section-label mb-2">{copy.page.eyebrow}</div>
          <h1 className="page-title">{copy.page.title}</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">{systemStatus.detail}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleLockAllDoors}
            disabled={isLockingDoors || unsecuredLocks.length === 0}
            className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
          >
            {isLockingDoors ? copy.page.locking : copy.page.lockAll}
          </Button>
          <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold/10 uppercase tracking-wider">
            <Link to="/app/settings">{copy.page.manageAutoLock}</Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Shield, label: copy.stats.system, value: systemStatus.label, color: systemStatus.color },
          { icon: Lock, label: copy.stats.locks, value: copy.stats.securedLocks(locksSecured, locks.length), color: locks.length > 0 ? 'text-gold' : 'text-muted-foreground' },
          { icon: Camera, label: copy.stats.cameras, value: copy.stats.onlineCameras(camerasOnline, cameras.length), color: cameras.length > 0 ? 'text-gold' : 'text-muted-foreground' },
          { icon: AlertTriangle, label: copy.stats.alerts, value: copy.stats.alertsToday(alertsToday), color: alertsToday > 0 ? 'text-destructive' : 'text-muted-foreground' },
        ].map((stat) => (
          <Card key={stat.label} className="luxury-card p-6">
            <stat.icon className={`mb-4 size-8 ${stat.color}`} />
            <div className="section-label mb-2">{stat.label}</div>
            <div className="font-display text-2xl font-light text-foreground">{stat.value}</div>
          </Card>
        ))}
      </div>

      <Card className="luxury-card mb-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl font-light">{copy.modes.title}</h3>
          <Badge variant="outline" className="border-gold text-gold uppercase text-xs">
            {copy.modes.active}: {activeMode === 'custom' ? copy.modes.custom : modeCards.find((mode) => mode.key === activeMode)?.label ?? copy.modes.custom}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {modeCards.map((mode) => (
            <div key={mode.key} className="rounded-lg border border-gold-muted/50 bg-background/60 p-5">
              <mode.icon className="mb-3 size-6 text-gold" />
              <h4 className="mb-2 font-display text-xl text-foreground">{mode.label}</h4>
              <p className="mb-4 font-body text-sm text-muted-foreground">{mode.description}</p>
              <Button
                onClick={() => handleApplyMode(mode.key)}
                disabled={isApplyingMode !== null}
                className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
              >
                {mode.label}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="luxury-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <BellRing className="size-5 text-gold" />
            <h3 className="font-display text-xl">{copy.autoLock.title}</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="section-label mb-1 text-xs">{copy.autoLock.status}</div>
              <p className="font-body text-sm text-foreground">{autoLockEnabled ? copy.autoLock.active : copy.autoLock.inactive}</p>
            </div>

            <div>
              <div className="section-label mb-1 text-xs">{copy.autoLock.nextRun}</div>
              <p className="font-body text-sm text-muted-foreground">
                {nextAutoLockRun ? formatDateTime(nextAutoLockRun) : copy.autoLock.fallback}
              </p>
            </div>

            <div>
              <div className="section-label mb-1 text-xs">{copy.autoLock.protectedDevices}</div>
              <p className="font-body text-sm text-muted-foreground">{copy.autoLock.coverage(protectedLockCount, locks.length)}</p>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <h3 className="mb-4 font-display text-xl">{copy.events.title}</h3>
          <div className="space-y-3">
            {recentEvents.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">{copy.events.empty}</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-4 rounded border border-gold-muted p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-3">
                      <p className="font-body text-sm text-foreground">{event.title}</p>
                      <Badge variant="outline" className={`uppercase text-xs ${getBadgeClass(event.type)}`}>
                        {copy.events.types[event.type]}
                      </Badge>
                    </div>
                    <p className="break-words font-body text-xs text-muted-foreground">{event.details}</p>
                    <p className="section-label mt-2 text-xs">{formatRelativeTime(event.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
