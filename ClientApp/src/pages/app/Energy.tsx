import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { api } from '@/lib/api'
import type { Device, EnergyAsset, EnergyData, EnergyOverview } from '@/types'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSignalR } from '@/hooks/useSignalR'
import { toast } from 'sonner'
import { useI18n } from '@/context/I18nContext'

export const Energy: React.FC = () => {
  const { locale } = useI18n()
  const [energyData, setEnergyData] = useState<EnergyData[]>([])
  const [overview, setOverview] = useState<EnergyOverview | null>(null)
  const [energyAssets, setEnergyAssets] = useState<EnergyAsset[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  const refreshData = useCallback(async () => {
    const [energySummary, energyOverview, energyAssetsData, devicesData] = await Promise.all([
      api.energy.getSummary(),
      api.energy.getOverview(),
      api.energy.getAssets(),
      api.devices.getAll(),
    ])

    setEnergyData(energySummary.data)
    setOverview(energyOverview)
    setEnergyAssets(energyAssetsData)
    setDevices(devicesData)
  }, [])

  useSignalR({ onUpdate: refreshData })

  useEffect(() => {
    refreshData()
      .catch((error) => {
        console.error('Failed to load energy data:', error)
        toast.error(locale === 'ro' ? 'Nu am putut incarca datele de consum' : 'Could not load energy data')
      })
      .finally(() => setLoading(false))
  }, [locale, refreshData])

  const chartData = useMemo(() => {
    const totalsByDay = new Map<string, { date: string; consumption: number; cost: number }>()

    for (const entry of energyData) {
      const dayKey = entry.date.slice(0, 10)
      const label = new Date(entry.date).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US', { month: 'short', day: 'numeric' })
      const current = totalsByDay.get(dayKey) ?? { date: label, consumption: 0, cost: 0 }

      current.consumption += entry.consumption
      current.cost += entry.cost
      totalsByDay.set(dayKey, current)
    }

    return [...totalsByDay.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, value]) => ({
        date: value.date,
        consumption: Number(value.consumption.toFixed(2)),
        cost: Number(value.cost.toFixed(2)),
      }))
  }, [energyData, locale])

  const totalConsumption = chartData.reduce((sum, e) => sum + e.consumption, 0)
  const totalCost = chartData.reduce((sum, e) => sum + e.cost, 0)

  const energyFlowCards = useMemo(() => {
    const current = overview?.current
    const today = overview?.today

    return [
      {
        label: locale === 'ro' ? 'Solar acum' : 'Solar now',
        value: `${Math.round(current?.solar_power_watts ?? 0)} W`,
        secondary: `${Math.round(today?.solar_wh ?? 0)} Wh`,
      },
      {
        label: locale === 'ro' ? 'Consum casa' : 'Home load',
        value: `${Math.round(current?.home_load_watts ?? 0)} W`,
        secondary: `${Math.round(today?.home_wh ?? 0)} Wh`,
      },
      {
        label: locale === 'ro' ? 'Retea acum' : 'Grid now',
        value: `${Math.round(current?.grid_power_watts ?? 0)} W`,
        secondary: locale === 'ro'
          ? `Import ${Math.round(today?.grid_import_wh ?? 0)} Wh / Export ${Math.round(today?.grid_export_wh ?? 0)} Wh`
          : `Import ${Math.round(today?.grid_import_wh ?? 0)} Wh / Export ${Math.round(today?.grid_export_wh ?? 0)} Wh`,
      },
      {
        label: locale === 'ro' ? 'Baterie' : 'Battery',
        value: `${Math.round(current?.battery_power_watts ?? 0)} W`,
        secondary: current?.battery_state_of_charge_percent !== undefined
          ? `${Math.round(current.battery_state_of_charge_percent)}% SOC`
          : (locale === 'ro' ? 'Fara SOC' : 'No SOC'),
      },
    ]
  }, [locale, overview])

  const timelineData = useMemo(() => {
    return (overview?.timeline ?? []).map((point) => ({
      timestamp: new Date(point.timestamp_utc).toLocaleTimeString(locale === 'ro' ? 'ro-RO' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      solar: Math.round(point.solar_power_watts),
      home: Math.round(point.home_load_watts),
      grid: Math.round(point.grid_power_watts),
      battery: Math.round(point.battery_power_watts),
    }))
  }, [locale, overview])

  const breakdown = useMemo(() => {
    const totalsByDevice = new Map<string, number>()

    for (const entry of energyData) {
      if (!entry.device_id) {
        continue
      }

      totalsByDevice.set(entry.device_id, (totalsByDevice.get(entry.device_id) ?? 0) + entry.consumption)
    }

    const totalTrackedConsumption = [...totalsByDevice.values()].reduce((sum, value) => sum + value, 0)

    return [...totalsByDevice.entries()]
      .map(([deviceId, consumption]) => {
        const device = devices.find(candidate => candidate.id === deviceId)
        return {
          name: device?.name || `Device ${deviceId}`,
          consumption,
          pct: totalTrackedConsumption > 0 ? Math.round((consumption / totalTrackedConsumption) * 100) : 0,
        }
      })
      .sort((left, right) => right.consumption - left.consumption)
  }, [devices, energyData])

  const comparison = useMemo(() => {
    const totals = chartData.map(item => item.consumption)
    const lastSeven = totals.slice(-7).reduce((sum, value) => sum + value, 0)
    const previousSeven = totals.slice(-14, -7).reduce((sum, value) => sum + value, 0)

    if (previousSeven <= 0) {
      return null
    }

    return Math.round(((lastSeven - previousSeven) / previousSeven) * 100)
  }, [chartData])

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-gold section-label">{locale === 'ro' ? 'Se incarca...' : 'Loading...'}</div></div>
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="section-label mb-2">ENERGY</div>
        <h1 className="page-title">{locale === 'ro' ? 'Consum si costuri.' : 'Consumption and cost.'}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {energyFlowCards.map((item) => (
          <Card key={item.label} className="luxury-card p-6">
            <div className="section-label mb-3">{item.label}</div>
            <div className="stat-number text-gold mb-2">{item.value}</div>
            <div className="font-body text-xs text-muted-foreground">{item.secondary}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {[
          { label: locale === 'ro' ? 'Total (ultimele 7 zile)' : 'Total (last 7 days)', value: totalConsumption.toFixed(1), unit: 'kWh' },
          { label: locale === 'ro' ? 'Cost total' : 'Total cost', value: `$${totalCost.toFixed(2)}`, unit: '' },
          { label: locale === 'ro' ? 'Vs 7 zile precedente' : 'Vs previous 7 days', value: comparison === null ? 'N/A' : `${comparison > 0 ? '+' : ''}${comparison}%`, unit: '', trend: comparison },
        ].map((stat, index) => (
          <Card key={index} className="luxury-card p-6">
            <div className="section-label mb-3">{stat.label}</div>
            <div className="stat-number text-gold mb-2">
              {stat.value}
              {stat.unit && <span className="text-2xl ml-1">{stat.unit}</span>}
            </div>
            {typeof stat.trend === 'number' && stat.trend !== 0 && (
              <div className="flex items-center gap-1">
                {stat.trend > 0 ? (
                  <TrendingUp className="size-4 text-gold" />
                ) : (
                  <TrendingDown className="size-4 text-gold" />
                )}
                <span className="font-body text-xs text-muted-foreground">
                  {locale === 'ro' ? 'comparat cu saptamana trecuta' : 'compared with last week'}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="luxury-card p-6 mb-8">
        <h3 className="font-display text-xl mb-4">{locale === 'ro' ? 'Assets energetice inregistrate' : 'Registered energy assets'}</h3>
        {energyAssets.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            {locale === 'ro'
              ? 'Nu exista inca invertor, baterie, panouri sau contoare descoperite prin bridge.'
              : 'No inverter, battery, solar array, or meters have been discovered from the bridge yet.'}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {energyAssets.map((asset) => (
              <div key={asset.id} className="rounded border border-gold-muted/40 bg-background/30 p-4">
                <div className="section-label mb-2 uppercase">{asset.kind}</div>
                <div className="font-display text-2xl text-gold">{asset.name}</div>
                <p className="mt-2 font-body text-sm text-muted-foreground">{asset.source_type}</p>
                {asset.current_power_watts !== undefined && (
                  <p className="mt-3 font-body text-sm text-foreground">{Math.round(asset.current_power_watts)} W</p>
                )}
                {asset.state_of_charge_percent !== undefined && (
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    SOC {Math.round(asset.state_of_charge_percent)}%
                  </p>
                )}
                {asset.last_telemetry_utc && (
                  <p className="mt-2 font-body text-xs text-muted-foreground">
                    {locale === 'ro' ? 'Ultima mostra' : 'Latest sample'}:{' '}
                    {new Date(asset.last_telemetry_utc).toLocaleString(locale === 'ro' ? 'ro-RO' : 'en-US')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="luxury-card p-6 mb-8">
        <h3 className="font-display text-xl mb-6">{locale === 'ro' ? 'Flux energetic recent' : 'Recent energy flow'}</h3>
        {timelineData.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            {locale === 'ro' ? 'Nu exista inca telemetrie pentru solar, baterie sau retea.' : 'No telemetry has been recorded yet for solar, battery, or grid.'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 168, 76, 0.1)" />
              <XAxis dataKey="timestamp" stroke="#888880" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888880" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans',
                }}
                labelStyle={{ color: '#C9A84C' }}
              />
              <Bar dataKey="solar" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="home" fill="#F5F1E8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="grid" fill="#6B7280" radius={[4, 4, 0, 0]} />
              <Bar dataKey="battery" fill="#8A6E2F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="luxury-card p-6 mb-8">
        <h3 className="font-display text-xl mb-6">{locale === 'ro' ? 'Consum zilnic' : 'Daily consumption'}</h3>
        {chartData.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            {locale === 'ro' ? 'Nu exista inca activitate de consum inregistrata.' : 'No energy activity has been recorded yet.'}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201, 168, 76, 0.1)" />
              <XAxis dataKey="date" stroke="#888880" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888880" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111111',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  borderRadius: '4px',
                  fontFamily: 'DM Sans',
                }}
                labelStyle={{ color: '#C9A84C' }}
              />
              <Bar dataKey="consumption" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="luxury-card p-6">
        <h3 className="font-display text-xl mb-4">{locale === 'ro' ? 'Consum pe dispozitive' : 'Device breakdown'}</h3>
        {breakdown.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            {locale === 'ro' ? 'Nu exista inca date de consum pentru dispozitive.' : 'No device energy usage has been recorded yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {breakdown.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-sm">{item.name}</span>
                  <span className="font-display text-lg text-gold">{item.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gold" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
