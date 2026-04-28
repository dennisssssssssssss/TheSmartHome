import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { Automation, DashboardStats, Room, Device, ActivityLog, EnergyData } from '@/types'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { DeviceIllustration } from '@/components/device-illustrations'
import { useAuth } from '@/context/AuthContext'
import { useSearch } from '@/context/SearchContext'
import { useI18n } from '@/context/I18nContext'
import { toast } from 'sonner'
import { useSignalR } from '@/hooks/useSignalR'
import { getDashboardContent } from '@/lib/i18n/content'

const AMBIENT_DEVICE_TYPES: Device['type'][] = ['bulb', 'tv', 'ac', 'plug', 'speaker', 'blinds']
const SECURITY_DEVICE_TYPES: Device['type'][] = ['lock', 'motion', 'door', 'camera']

type QuickActionId = 'all-lights-off' | 'lock-all-doors' | 'activate-security' | 'evening-mode' | 'good-night'

function extractDeviceId(details: string): string | undefined {
  const match = details.match(/DeviceId=(\d+)/i)
  return match?.[1]
}

export const Dashboard: React.FC = () => {
  const { username } = useAuth()
  const { searchQuery } = useSearch()
  const { locale, formatDate, formatRelativeTime } = useI18n()
  const copy = getDashboardContent(locale)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [energyData, setEnergyData] = useState<EnergyData[]>([])
  const [loading, setLoading] = useState(true)

  const dashboardUi = locale === 'ro'
    ? {
        heroEyebrow: 'HOME OVERVIEW',
        heroTitle: 'Casa ta, intr-o singura privire.',
        heroDescription:
          'Aici vezi ce este activ, ce lipseste si care este urmatorul pas bun, fara sa intri prin fiecare pagina.',
        shortcuts: {
          rooms: 'Vezi camerele',
          automations: 'Deschide automatizarile',
          integrations: 'Gestionare integrari',
        },
        pulseTitle: 'Pulsul casei',
        pulse: {
          liveRooms: 'camere active',
          liveSecurity: 'dispozitive de securitate active',
          needsSetup: 'camere fara dispozitive',
        },
        spotlightTitle: 'Focus de azi',
        nextAutomation: 'Urmatoarea automatizare',
        nextAutomationEmpty: 'Nu ai inca o automatizare activa.',
        nextAutomationHint: 'Automatizarile recurente tin casa consecventa si usor de prezentat.',
        mostActiveRoom: 'Camera cea mai activa',
        noRoomsYet: 'Inca nu exista camere configurate.',
        integrationReadiness: 'Dispozitive integrate',
        integrationHint: 'Leaga device-uri reale prin Matter sau Modbus cand vrei sa treci din demo in utilizare.',
        actionDescriptions: {
          'all-lights-off': 'Bun cand vrei sa inchizi rapid consumul vizibil din toata casa.',
          'lock-all-doors': 'Ideal pentru plecare sau pentru o verificare rapida de seara.',
          'activate-security': 'Porneste stratul de protectie care trebuie sa ramana mereu clar.',
          'evening-mode': 'Lasa luminile pornite intr-un ton calm, potrivit pentru seara.',
          'good-night': 'Opreste confortul si lasa securitatea activa pentru noapte.',
        } as Record<QuickActionId, string>,
        operationalOverview: 'Situatie operationala',
        roomToggle: 'Control pe camera',
        energyHealth: 'Ritmul energiei',
      }
    : {
        heroEyebrow: 'HOME OVERVIEW',
        heroTitle: 'Your home, in one practical view.',
        heroDescription:
          'See what is active, what still needs setup, and what the next useful move is without jumping through pages.',
        shortcuts: {
          rooms: 'Open rooms',
          automations: 'Open automations',
          integrations: 'Manage integrations',
        },
        pulseTitle: 'Home pulse',
        pulse: {
          liveRooms: 'active rooms',
          liveSecurity: 'active security devices',
          needsSetup: 'rooms missing devices',
        },
        spotlightTitle: 'Today focus',
        nextAutomation: 'Next automation',
        nextAutomationEmpty: 'You do not have an active automation yet.',
        nextAutomationHint: 'Recurring routines make the home easier to operate and demo.',
        mostActiveRoom: 'Most active room',
        noRoomsYet: 'No rooms configured yet.',
        integrationReadiness: 'Integrated devices',
        integrationHint: 'Connect real hardware through Matter or Modbus when you want to go beyond the demo layer.',
        actionDescriptions: {
          'all-lights-off': 'Useful when you want one fast sweep across the visible energy load.',
          'lock-all-doors': 'Great before leaving or for a quick evening safety check.',
          'activate-security': 'Turns on the protection layer that should always feel obvious.',
          'evening-mode': 'Keeps the lighting warm and calm for the evening rhythm.',
          'good-night': 'Shuts down comfort devices and keeps security running overnight.',
        } as Record<QuickActionId, string>,
        operationalOverview: 'Operational overview',
        roomToggle: 'Room control',
        energyHealth: 'Energy rhythm',
      }

  const refreshData = useCallback(async () => {
    try {
      const [statsData, roomsData, devicesData, automationsData, logsData, energySummary] = await Promise.all([
        api.dashboard.getStats(),
        api.rooms.getAll(),
        api.devices.getAll(),
        api.automations.getAll(),
        api.logs.getAll(),
        api.energy.getSummary(),
      ])
      setStats(statsData)
      setRooms(roomsData)
      setDevices(devicesData)
      setAutomations(automationsData)
      setRecentActivity(logsData)
      setEnergyData(energySummary.data)
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    }
  }, [])

  const handleReceiveLog = useCallback((log: unknown) => {
    const raw = log as Record<string, string> | undefined
    if (!raw) return

    const mapped: ActivityLog = {
      id: String(raw.id),
      action: raw.action,
      details: raw.details,
      created_at: raw.timestampUtc,
      device_id: extractDeviceId(raw.details ?? ''),
    }

    setRecentActivity((previous) => [mapped, ...previous].slice(0, 50))
  }, [])

  useSignalR({ onUpdate: refreshData, onLog: handleReceiveLog, onNotificationUpdated: refreshData })

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshData()
      } catch {
        toast.error(copy.errors.load)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [copy.errors.load, refreshData])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return copy.greetings.morning
    if (hour < 18) return copy.greetings.afternoon
    return copy.greetings.evening
  }

  const roomDevices = (roomId: string) => devices.filter((device) => device.room_id === roomId)
  const getRoomPowerDevices = (roomId: string) => roomDevices(roomId).filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true
    return room.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const recurringAutomations = automations.filter((automation) => automation.enabled && (automation.interval_minutes ?? 0) > 0)
  const integratedDeviceCount = devices.filter((device) => Boolean(device.integration_protocol)).length
  const activeComfortRooms = rooms.filter((room) => getRoomPowerDevices(room.id).some((device) => device.status)).length
  const activeSecurityDevices = devices.filter((device) => SECURITY_DEVICE_TYPES.includes(device.type) && device.status).length
  const roomsMissingDevices = rooms.filter((room) => roomDevices(room.id).length === 0).length
  const weeklyEnergy = energyData.reduce((sum, entry) => sum + entry.consumption, 0)
  const yesterdayTrend = stats?.trend.energy ?? 0
  const activeDevicesNow = stats?.active_devices ?? 0
  const totalDevices = stats?.total_devices ?? 0

  const onboardingSteps = [
    {
      id: 'rooms',
      completed: rooms.length > 0,
      title: copy.onboarding.steps.rooms.title,
      description: copy.onboarding.steps.rooms.description,
      action: copy.onboarding.steps.rooms.action,
      href: copy.onboarding.steps.rooms.href,
    },
    {
      id: 'devices',
      completed: devices.length > 0,
      title: copy.onboarding.steps.devices.title,
      description: copy.onboarding.steps.devices.description,
      action: copy.onboarding.steps.devices.action,
      href: copy.onboarding.steps.devices.href,
    },
    {
      id: 'automations',
      completed: automations.length > 0,
      title: copy.onboarding.steps.automations.title,
      description: copy.onboarding.steps.automations.description,
      action: copy.onboarding.steps.automations.action,
      href: copy.onboarding.steps.automations.href,
    },
  ]

  const completedSteps = onboardingSteps.filter((step) => step.completed).length
  const showOnboarding = completedSteps < onboardingSteps.length

  const upcomingAutomation = useMemo(() => {
    return [...automations]
      .filter((automation) => automation.enabled)
      .sort((left, right) => new Date(left.trigger_value).getTime() - new Date(right.trigger_value).getTime())[0]
  }, [automations])

  const busiestRoom = useMemo(() => {
    return [...rooms]
      .sort((left, right) => {
        const leftScore = roomDevices(left.id).filter((device) => device.status).length
        const rightScore = roomDevices(right.id).filter((device) => device.status).length
        return rightScore - leftScore
      })[0]
  }, [rooms, devices])

  const quickActionMeta = useMemo(
    () =>
      copy.quickActions.items.map((action) => ({
        ...action,
        description: dashboardUi.actionDescriptions[action.id],
      })),
    [copy.quickActions.items, dashboardUi.actionDescriptions],
  )

  const handleQuickAction = async (action: QuickActionId) => {
    try {
      switch (action) {
        case 'all-lights-off':
          await Promise.all(
            devices
              .filter((device) => device.type === 'bulb')
              .map((device) => api.devices.control(device.id, { status: false })),
          )
          break
        case 'lock-all-doors':
          await Promise.all(
            devices
              .filter((device) => device.type === 'lock')
              .map((device) => api.devices.control(device.id, { status: true })),
          )
          break
        case 'activate-security':
          await Promise.all(
            devices
              .filter((device) => SECURITY_DEVICE_TYPES.includes(device.type))
              .map((device) => api.devices.control(device.id, { status: true })),
          )
          break
        case 'evening-mode':
          await Promise.all(
            devices
              .filter((device) => device.type === 'bulb')
              .map((device) => api.devices.control(device.id, { status: true, value: 40 })),
          )
          break
        case 'good-night':
          await Promise.all([
            ...devices
              .filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))
              .map((device) => api.devices.control(device.id, { status: false })),
            ...devices
              .filter((device) => SECURITY_DEVICE_TYPES.includes(device.type))
              .map((device) => api.devices.control(device.id, { status: true })),
          ])
          break
      }

      toast.success(copy.success.action)
      await refreshData()
    } catch {
      toast.error(copy.errors.action)
    }
  }

  const handleRoomToggle = async (roomId: string) => {
    try {
      const roomDeviceList = getRoomPowerDevices(roomId)
      if (roomDeviceList.length === 0) {
        toast.error(copy.errors.roomToggleUnavailable)
        return
      }

      const anyActive = roomDeviceList.some((device) => device.status)
      await Promise.all(
        roomDeviceList.map((device) => api.devices.control(device.id, { status: !anyActive })),
      )

      toast.success(copy.success.roomToggle)
      await refreshData()
    } catch {
      toast.error(copy.errors.roomToggle)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="mb-2 h-10 w-72" />
        <Skeleton className="mb-8 h-5 w-48" />
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="luxury-card p-6">
              <Skeleton className="mb-3 h-4 w-24" />
              <Skeleton className="mb-2 h-10 w-16" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="page-title">{getGreeting()}, {username || 'Admin'}.</h1>
        <p className="section-label mt-2">
          {formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Card className="luxury-card mb-6 overflow-hidden">
        <div className="grid gap-0 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="section-label mb-2">{dashboardUi.heroEyebrow}</div>
            <h2 className="font-display text-3xl font-light text-foreground sm:text-4xl">{dashboardUi.heroTitle}</h2>
            <p className="mt-3 max-w-2xl font-body text-sm text-muted-foreground sm:text-base">
              {dashboardUi.heroDescription}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gold/15 bg-background/60 p-4">
                <div className="section-label mb-2">{dashboardUi.pulseTitle}</div>
                <p className="text-2xl font-display text-foreground">{activeDevicesNow}/{totalDevices}</p>
                <p className="mt-1 text-sm text-muted-foreground">{locale === 'ro' ? 'dispozitive active acum' : 'devices active right now'}</p>
              </div>
              <div className="rounded-2xl border border-gold/15 bg-background/60 p-4">
                <div className="section-label mb-2">{copy.quickActions.title}</div>
                <p className="text-2xl font-display text-foreground">{recurringAutomations.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">{locale === 'ro' ? 'rutine recurente pornite' : 'recurring routines enabled'}</p>
              </div>
              <div className="rounded-2xl border border-gold/15 bg-background/60 p-4">
                <div className="section-label mb-2">{dashboardUi.integrationReadiness}</div>
                <p className="text-2xl font-display text-foreground">{integratedDeviceCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">{locale === 'ro' ? 'dispozitive legate de integrari' : 'devices linked to integrations'}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                <Link to="/app/rooms">
                  {dashboardUi.shortcuts.rooms}
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider">
                <Link to="/app/automations">{dashboardUi.shortcuts.automations}</Link>
              </Button>
              <Button asChild variant="ghost" className="text-gold hover:text-gold-light uppercase tracking-wider">
                <Link to="/app/integrations">{dashboardUi.shortcuts.integrations}</Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-gold/10 bg-gradient-to-br from-gold/6 via-transparent to-transparent p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="mb-4 flex items-center gap-2">
              <Radio className="size-4 text-gold" />
              <h3 className="font-display text-2xl text-foreground">{dashboardUi.pulseTitle}</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-gold/10 bg-background/70 p-4">
                <p className="section-label mb-2">{dashboardUi.pulse.liveRooms}</p>
                <p className="text-3xl font-display text-foreground">{activeComfortRooms}</p>
              </div>
              <div className="rounded-2xl border border-gold/10 bg-background/70 p-4">
                <p className="section-label mb-2">{dashboardUi.pulse.liveSecurity}</p>
                <p className="text-3xl font-display text-foreground">{activeSecurityDevices}</p>
              </div>
              <div className="rounded-2xl border border-gold/10 bg-background/70 p-4">
                <p className="section-label mb-2">{dashboardUi.pulse.needsSetup}</p>
                <p className="text-3xl font-display text-foreground">{roomsMissingDevices}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {showOnboarding && (
        <Card className="luxury-card mb-6 p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="section-label mb-2">{copy.onboarding.eyebrow}</div>
              <h2 className="font-display text-3xl font-light text-foreground">{copy.onboarding.title}</h2>
              <p className="mt-2 font-body text-sm text-muted-foreground">{copy.onboarding.description}</p>
            </div>
            <div className="rounded-full border border-gold-muted/60 px-4 py-2 text-sm font-body text-gold">
              {copy.onboarding.progress(completedSteps, onboardingSteps.length)}
            </div>
          </div>

          <Progress value={(completedSteps / onboardingSteps.length) * 100} className="mb-6 h-2 bg-muted [&>div]:bg-gold" />

          <div className="grid gap-4 xl:grid-cols-3">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="rounded-2xl border border-gold-muted/50 bg-background/60 p-5">
                <div className="mb-3 flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="size-5 text-gold" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground" />
                  )}
                  <h3 className="font-display text-xl text-foreground">{step.title}</h3>
                </div>
                <p className="mb-4 font-body text-sm text-muted-foreground">{step.description}</p>
                {step.completed ? (
                  <div className="inline-flex items-center gap-2 text-sm font-body text-gold">
                    <Sparkles className="size-4" />
                    {copy.onboarding.complete}
                  </div>
                ) : (
                  <Button asChild className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                    <Link to={step.href}>{step.action}</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: copy.stats.devices, value: stats?.total_devices || 0, trend: stats?.trend.devices || 0, unit: '' },
          { label: copy.stats.active, value: stats?.active_devices || 0, trend: 0, unit: '' },
          { label: copy.stats.rooms, value: stats?.total_rooms || 0, trend: 0, unit: '' },
          { label: copy.stats.energyToday, value: stats?.energy_today || 0, trend: stats?.trend.energy || 0, unit: 'kWh' },
        ].map((stat) => (
          <Card key={stat.label} className="luxury-card p-5 sm:p-6">
            <div className="section-label mb-3">{stat.label}</div>
            <div className="stat-number mb-2 text-foreground">
              {stat.value}
              {stat.unit && <span className="ml-1 text-2xl">{stat.unit}</span>}
            </div>
            {stat.trend !== 0 && (
              <div className="flex items-center gap-1">
                {stat.trend > 0 ? <TrendingUp className="size-4 text-gold" /> : <TrendingDown className="size-4 text-gold" />}
                <span className="font-body text-xs text-gold">
                  {stat.trend > 0 ? '+' : ''}{stat.trend} {stat.label === copy.stats.energyToday ? '%' : copy.stats.weekTrend}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="luxury-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="size-4 text-gold" />
            <h2 className="font-display text-2xl font-light text-foreground">{dashboardUi.spotlightTitle}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gold/10 bg-background/60 p-4">
              <p className="section-label mb-2">{dashboardUi.nextAutomation}</p>
              {upcomingAutomation ? (
                <>
                  <p className="font-display text-2xl text-foreground">{upcomingAutomation.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(upcomingAutomation.trigger_value, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl text-foreground">{dashboardUi.nextAutomationEmpty}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{dashboardUi.nextAutomationHint}</p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gold/10 bg-background/60 p-4">
              <p className="section-label mb-2">{dashboardUi.mostActiveRoom}</p>
              {busiestRoom ? (
                <>
                  <p className="font-display text-2xl text-foreground">{busiestRoom.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {roomDevices(busiestRoom.id).filter((device) => device.status).length} {locale === 'ro' ? 'dispozitive active' : 'active devices'}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl text-foreground">{dashboardUi.noRoomsYet}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{copy.onboarding.steps.rooms.description}</p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gold/10 bg-background/60 p-4">
              <p className="section-label mb-2">{dashboardUi.integrationReadiness}</p>
              <p className="font-display text-2xl text-foreground">{integratedDeviceCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">{dashboardUi.integrationHint}</p>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="size-4 text-gold" />
            <h2 className="font-display text-2xl font-light text-foreground">{dashboardUi.operationalOverview}</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/10 bg-background/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="section-label">{dashboardUi.roomToggle}</span>
                <span className="text-sm text-gold">{activeComfortRooms}/{rooms.length || 1}</span>
              </div>
              <Progress value={rooms.length > 0 ? (activeComfortRooms / rooms.length) * 100 : 0} className="h-2 bg-muted [&>div]:bg-gold" />
            </div>

            <div className="rounded-2xl border border-gold/10 bg-background/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="section-label">{dashboardUi.energyHealth}</span>
                <span className="text-sm text-gold">{(stats?.energy_today ?? 0).toFixed(1)} kWh</span>
              </div>
              <Progress
                value={Math.min(((stats?.energy_today ?? 0) / Math.max(weeklyEnergy || 1, 1)) * 100, 100)}
                className="h-2 bg-muted [&>div]:bg-gold"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === 'ro'
                  ? 'Compari rapid energia de azi cu ritmul saptamanii.'
                  : 'Quickly compare today against the current weekly rhythm.'}
              </p>
            </div>

            <div className="rounded-2xl border border-gold/10 bg-background/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="section-label">{copy.activity.title}</span>
                <span className="text-sm text-gold">{recentActivity.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {recentActivity.length > 0 ? recentActivity[0].action : copy.activity.empty}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-light">{copy.quickActions.title}</h2>
          <Link to="/app/automations" className="text-sm text-gold hover:text-gold-light">
            {dashboardUi.shortcuts.automations}
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {quickActionMeta.map((action) => (
            <Card key={action.id} className="luxury-card flex flex-col p-4 sm:p-5">
              <p className="mb-2 font-display text-xl text-foreground">{action.label}</p>
              <p className="mb-4 flex-1 text-sm text-muted-foreground">{action.description}</p>
              <Button
                variant="outline"
                onClick={() => handleQuickAction(action.id)}
                className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider font-body text-xs"
              >
                {locale === 'ro' ? 'Ruleaza acum' : 'Run now'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-light">{copy.rooms.title}</h2>
            <Link to="/app/rooms">
              <Button variant="ghost" size="sm" className="text-gold hover:text-gold-light">
                {copy.rooms.viewAll}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {filteredRooms.slice(0, 4).map((room) => {
              const roomDeviceList = roomDevices(room.id)
              const roomPowerDevices = getRoomPowerDevices(room.id)
              const activePowerCount = roomPowerDevices.filter((device) => device.status).length
              const totalPowerCount = roomPowerDevices.length
              const progress = totalPowerCount > 0 ? (activePowerCount / totalPowerCount) * 100 : 0

              return (
                <Card key={room.id} className="luxury-card p-4 sm:p-5">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="card-title text-foreground">{room.name}</h3>
                      <p className="section-label mt-1 text-xs">
                        {totalPowerCount > 0
                          ? copy.rooms.activeComfort(activePowerCount, totalPowerCount)
                          : copy.rooms.emptyComfort}
                      </p>
                    </div>
                    <Switch
                      checked={roomPowerDevices.some((device) => device.status)}
                      onCheckedChange={() => handleRoomToggle(room.id)}
                      disabled={roomPowerDevices.length === 0}
                      className="data-[state=checked]:bg-gold"
                    />
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {roomDeviceList.slice(0, 4).map((device) => (
                      <div
                        key={device.id}
                        className="flex size-9 items-center justify-center rounded border"
                        style={{
                          borderColor: device.status ? 'rgba(201, 168, 76, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                          backgroundColor: device.status ? 'rgba(201, 168, 76, 0.06)' : 'transparent',
                        }}
                      >
                        <div className="size-6">
                          <DeviceIllustration type={device.type} isOn={device.status} value={device.value} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Progress value={progress} className="h-1 bg-muted [&>div]:bg-gold" />
                </Card>
              )
            })}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-light">{copy.activity.title}</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <Card className="luxury-card p-5">
                <p className="font-body text-sm text-muted-foreground">{copy.activity.empty}</p>
              </Card>
            )}
            {recentActivity.slice(0, 6).map((log) => {
              const device = devices.find((candidate) => candidate.id === log.device_id)
              return (
                <Card
                  key={log.id}
                  className="luxury-card flex items-start gap-4 p-4"
                  style={{ borderLeft: '2px solid rgba(201, 168, 76, 0.4)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="section-label mb-1 text-xs">{formatRelativeTime(log.created_at)}</div>
                    <p className="font-body text-sm text-foreground">{log.action}</p>
                    <p className="mt-1 font-body text-xs text-muted-foreground">{device?.name || copy.activity.unknownDevice}</p>
                  </div>
                  <div className="size-10 shrink-0">
                    {device && <DeviceIllustration type={device.type} isOn={device.status} value={device.value} />}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      <Card className="luxury-card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="size-5 text-gold" />
          <h3 className="font-display text-xl">{copy.energy.title}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="section-label mb-2 text-xs">{copy.energy.today}</p>
            <p className="font-display text-3xl font-light text-foreground">
              {(stats?.energy_today ?? 0).toFixed(1)} <span className="text-lg">kWh</span>
            </p>
          </div>
          <div>
            <p className="section-label mb-2 text-xs">{copy.energy.thisWeek}</p>
            <p className="font-display text-3xl font-light text-foreground">
              {weeklyEnergy.toFixed(1)} <span className="text-lg">kWh</span>
            </p>
          </div>
          <div>
            <p className="section-label mb-2 text-xs">{copy.energy.vsPreviousDay}</p>
            <p className="font-display text-3xl font-light text-gold">
              {yesterdayTrend > 0 ? '+' : ''}{yesterdayTrend}%
            </p>
            <p className="mt-1 font-body text-xs text-muted-foreground">{copy.energy.previousDayHint}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
