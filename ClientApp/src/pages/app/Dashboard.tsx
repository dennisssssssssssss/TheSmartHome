import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { Automation, DashboardStats, Room, Device, ActivityLog, EnergyData } from '@/types'
import { CheckCircle2, ChevronRight, Circle, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react'
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
    const raw = log as any
    if (!raw) return
    const mapped: ActivityLog = {
      id: String(raw.id),
      action: raw.action,
      details: raw.details,
      created_at: raw.timestampUtc,
      device_id: extractDeviceId(raw.details ?? ''),
    }
    setRecentActivity((prev) => [mapped, ...prev].slice(0, 50))
  }, [])

  useSignalR({ onUpdate: refreshData, onLog: handleReceiveLog, onNotificationUpdated: refreshData })

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return copy.greetings.morning
    if (hour < 18) return copy.greetings.afternoon
    return copy.greetings.evening
  }

  const roomDevices = (roomId: string) => devices.filter((device) => device.room_id === roomId)

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true
    return room.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const weeklyEnergy = energyData.reduce((sum, entry) => sum + entry.consumption, 0)
  const yesterdayTrend = stats?.trend.energy ?? 0

  const getRoomPowerDevices = (roomId: string) => roomDevices(roomId).filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))

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

  const handleQuickAction = async (action: QuickActionId) => {
    try {
      switch (action) {
        case 'all-lights-off':
          await Promise.all(
            devices.filter((device) => device.type === 'bulb').map((device) => api.devices.control(device.id, { status: false })),
          )
          break
        case 'lock-all-doors':
          await Promise.all(
            devices.filter((device) => device.type === 'lock').map((device) => api.devices.control(device.id, { status: true })),
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
            devices.filter((device) => device.type === 'bulb').map((device) => api.devices.control(device.id, { status: true, value: 40 })),
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
    } catch (error) {
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
    } catch (error) {
      toast.error(copy.errors.roomToggle)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-2 h-10 w-72" />
        <Skeleton className="mb-8 h-5 w-48" />
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="page-title">{getGreeting()}, {username || 'Admin'}.</h1>
        <p className="section-label mt-2">
          {formatDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {showOnboarding && (
        <Card className="luxury-card mb-8 p-6">
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

          <div className="grid gap-4 lg:grid-cols-3">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="rounded-lg border border-gold-muted/50 bg-background/60 p-5">
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

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: copy.stats.devices, value: stats?.total_devices || 0, trend: stats?.trend.devices || 0, unit: '' },
          { label: copy.stats.active, value: stats?.active_devices || 0, trend: 0, unit: '' },
          { label: copy.stats.rooms, value: stats?.total_rooms || 0, trend: 0, unit: '' },
          { label: copy.stats.energyToday, value: stats?.energy_today || 0, trend: stats?.trend.energy || 0, unit: 'kWh' },
        ].map((stat) => (
          <Card key={stat.label} className="luxury-card p-6">
            <div className="section-label mb-3">{stat.label}</div>
            <div className="stat-number mb-2 text-foreground">
              {stat.value}
              {stat.unit && <span className="ml-1 text-2xl">{stat.unit}</span>}
            </div>
            {stat.trend !== 0 && (
              <div className="flex items-center gap-1">
                {stat.trend > 0 ? (
                  <TrendingUp className="size-4 text-gold" />
                ) : (
                  <TrendingDown className="size-4 text-gold" />
                )}
                <span className="font-body text-xs text-gold">
                  {stat.trend > 0 ? '+' : ''}{stat.trend} {stat.label === copy.stats.energyToday ? '%' : copy.stats.weekTrend}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-2xl font-light">{copy.quickActions.title}</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {copy.quickActions.items.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              onClick={() => handleQuickAction(action.id)}
              className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider font-body text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
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
                <Card key={room.id} className="luxury-card p-5 hover:border-gold-light">
                  <div className="mb-3 flex items-start justify-between">
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
                  <div className="mb-3 flex gap-2">
                    {roomDeviceList.slice(0, 4).map((device) => (
                      <div
                        key={device.id}
                        className="flex size-8 items-center justify-center rounded border"
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
            {recentActivity.map((log) => {
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

      <Card className="luxury-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="size-5 text-gold" />
          <h3 className="font-display text-xl">{copy.energy.title}</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="section-label mb-2 text-xs">{copy.energy.today}</p>
            <p className="font-display text-3xl font-light text-foreground">{stats?.energy_today.toFixed(1)} <span className="text-lg">kWh</span></p>
          </div>
          <div>
            <p className="section-label mb-2 text-xs">{copy.energy.thisWeek}</p>
            <p className="font-display text-3xl font-light text-foreground">{weeklyEnergy.toFixed(1)} <span className="text-lg">kWh</span></p>
          </div>
          <div>
            <p className="section-label mb-2 text-xs">{copy.energy.vsPreviousDay}</p>
            <p className="font-display text-3xl font-light text-gold">
              {yesterdayTrend > 0 ? '+' : ''}{yesterdayTrend}% <span className="text-lg"></span>
            </p>
            <p className="mt-1 font-body text-xs text-muted-foreground">{copy.energy.previousDayHint}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
