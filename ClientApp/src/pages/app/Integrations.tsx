import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BatteryCharging, Cable, ChevronRight, Cpu, Plug, SunMedium } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import type {
  Device,
  IntegrationConnectionTestResult,
  IntegrationDiscoveredDevice,
  IntegrationOverview,
  IntegrationProtocolOverview,
  ModbusTelemetrySyncResult,
  Room,
} from '@/types'
import { useI18n } from '@/context/I18nContext'
import { getIntegrationsContent } from '@/lib/i18n/integrations'
import { getRoomDeviceTypeLabel, getTransportLabel } from '@/lib/i18n/rooms'

type WizardProtocol = 'matter' | 'modbus'

const MATTER_DEVICE_TYPES: Device['type'][] = ['bulb', 'plug', 'thermostat', 'ac', 'blinds', 'speaker', 'camera', 'lock']

const DEFAULT_CONNECTION_FORM = {
  baseUrl: '',
  apiKey: '',
  preserveExistingApiKey: true,
  clearApiKey: false,
  telemetrySyncEnabled: false,
  telemetrySyncIntervalMinutes: 15,
}

const DEFAULT_MATTER_FORM = {
  pairingCode: '',
  roomId: '',
  name: '',
  type: 'bulb' as Device['type'],
  transport: 'wifi',
}

function resolveDiscoveredDeviceType(value?: string, fallback: Device['type'] = 'plug'): Device['type'] {
  const normalized = value?.trim().toLowerCase()
  const supportedTypes: Device['type'][] = ['bulb', 'plug', 'thermostat', 'ac', 'blinds', 'speaker', 'camera', 'lock', 'motion', 'tv']
  return supportedTypes.includes(normalized as Device['type']) ? normalized as Device['type'] : fallback
}

function getProtocolAccent(protocol: IntegrationProtocolOverview['code']) {
  switch (protocol) {
    case 'matter':
      return 'text-gold'
    case 'modbus':
      return 'text-foreground'
    case 'mqtt':
      return 'text-muted-foreground'
    default:
      return 'text-gold'
  }
}

function getDefaultDeviceValue(type: Device['type']) {
  switch (type) {
    case 'bulb':
      return 75
    case 'thermostat':
    case 'ac':
      return 22
    case 'speaker':
      return 35
    case 'blinds':
      return 50
    default:
      return 0
  }
}

function getDefaultDeviceStatus(type: Device['type']) {
  switch (type) {
    case 'camera':
    case 'motion':
    case 'lock':
      return true
    default:
      return false
  }
}

export const Integrations: React.FC = () => {
  const { locale, formatDateTime } = useI18n()
  const copy = getIntegrationsContent(locale)
  const [overview, setOverview] = useState<IntegrationOverview | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardProtocol, setWizardProtocol] = useState<WizardProtocol | null>(null)
  const [connectionForm, setConnectionForm] = useState(DEFAULT_CONNECTION_FORM)
  const [matterForm, setMatterForm] = useState(DEFAULT_MATTER_FORM)
  const [testResult, setTestResult] = useState<IntegrationConnectionTestResult | null>(null)
  const [syncResult, setSyncResult] = useState<ModbusTelemetrySyncResult | null>(null)
  const [discoveredDevices, setDiscoveredDevices] = useState<IntegrationDiscoveredDevice[]>([])
  const [busyAction, setBusyAction] = useState<'save' | 'test' | 'pair' | 'sync' | 'discover' | 'import' | null>(null)

  const refreshData = useCallback(async () => {
    const [overviewData, roomsData] = await Promise.all([
      api.integrations.getOverview(),
      api.rooms.getAll(),
    ])

    setOverview(overviewData)
    setRooms(roomsData)
  }, [])

  useEffect(() => {
    refreshData()
      .catch((error) => {
        console.error('Failed to load integrations overview:', error)
        toast.error(copy.errors.load)
      })
      .finally(() => setLoading(false))
  }, [copy.errors.load, refreshData])

  const selectedProtocol = useMemo(
    () => overview?.protocols.find((protocol) => protocol.code === wizardProtocol) ?? null,
    [overview?.protocols, wizardProtocol],
  )

  const stats = useMemo(() => ({
    integratedDevices: overview?.totalIntegratedDevices ?? 0,
    protocols: overview?.protocols.length ?? 0,
    telemetrySources: overview?.telemetrySources.length ?? 0,
  }), [overview])

  const matterTransportOptions = useMemo(
    () => selectedProtocol?.code === 'matter' ? selectedProtocol.transports : ['wifi', 'thread'],
    [selectedProtocol],
  )

  const matterTypeOptions = useMemo(() => MATTER_DEVICE_TYPES.map((type) => ({
    value: type,
    label: getRoomDeviceTypeLabel(type, locale),
  })), [locale])

  const openWizard = (protocol: WizardProtocol) => {
    const protocolDetails = overview?.protocols.find((item) => item.code === protocol)
    if (!protocolDetails) {
      return
    }

    setWizardProtocol(protocol)
    setConnectionForm({
      baseUrl: protocolDetails.baseUrl ?? '',
      apiKey: '',
      preserveExistingApiKey: true,
      clearApiKey: false,
      telemetrySyncEnabled: protocolDetails.telemetrySyncEnabled,
      telemetrySyncIntervalMinutes: protocolDetails.telemetrySyncIntervalMinutes || 15,
    })
    setMatterForm({
      ...DEFAULT_MATTER_FORM,
      roomId: rooms[0]?.id ?? '',
      transport: protocolDetails.transports[0] ?? 'wifi',
    })
    setTestResult(null)
    setSyncResult(null)
    setDiscoveredDevices([])
    setWizardOpen(true)
  }

  const closeWizard = () => {
    setWizardOpen(false)
    setWizardProtocol(null)
    setBusyAction(null)
    setTestResult(null)
    setSyncResult(null)
    setDiscoveredDevices([])
  }

  const buildConnectionPayload = () => ({
    baseUrl: connectionForm.baseUrl.trim() || undefined,
    apiKey: connectionForm.apiKey.trim() || undefined,
    preserveExistingApiKey: connectionForm.clearApiKey ? false : connectionForm.preserveExistingApiKey,
    clearApiKey: connectionForm.clearApiKey,
    telemetrySyncEnabled: wizardProtocol === 'modbus' ? connectionForm.telemetrySyncEnabled : false,
    telemetrySyncIntervalMinutes: connectionForm.telemetrySyncIntervalMinutes,
  })

  const saveConnection = async () => {
    if (!wizardProtocol) {
      return
    }

    setBusyAction('save')
    try {
      await api.integrations.saveConnection(wizardProtocol, buildConnectionPayload())
      await refreshData()
      setConnectionForm((current) => ({
        ...current,
        apiKey: '',
        preserveExistingApiKey: true,
        clearApiKey: false,
      }))
      toast.success(copy.success.connectionSaved)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.saveConnection)
    } finally {
      setBusyAction(null)
    }
  }

  const testConnection = async () => {
    if (!wizardProtocol) {
      return
    }

    setBusyAction('test')
    try {
      const result = await api.integrations.testConnection(wizardProtocol, {
        baseUrl: connectionForm.baseUrl.trim() || undefined,
        apiKey: connectionForm.apiKey.trim() || undefined,
      })

      setTestResult(result)
      toast[result.isReachable ? 'success' : 'error'](result.isReachable ? copy.success.connectionTestOk : result.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.testConnection)
    } finally {
      setBusyAction(null)
    }
  }

  const handleMatterPairAndCreate = async () => {
    if (!matterForm.pairingCode.trim()) {
      toast.error(copy.errors.matterPairingCodeRequired)
      return
    }

    if (!matterForm.roomId) {
      toast.error(copy.errors.matterRoomRequired)
      return
    }

    setBusyAction('pair')
    try {
      await api.integrations.saveConnection('matter', buildConnectionPayload())

      const pairing = await api.devices.pairMatter({
        pairing_code: matterForm.pairingCode.trim(),
        bridge_base_url: connectionForm.baseUrl.trim() || undefined,
        transport: matterForm.transport || undefined,
        name: matterForm.name.trim() || undefined,
        type: matterForm.type,
      })

      await api.devices.create({
        name: matterForm.name.trim() || pairing.suggested_name || `${selectedProtocol?.label ?? 'Matter'} device`,
        type: matterForm.type,
        room_id: matterForm.roomId,
        value: getDefaultDeviceValue(matterForm.type),
        status: getDefaultDeviceStatus(matterForm.type),
        unit: '',
        integration_protocol: 'matter',
        connection_transport: pairing.transport || matterForm.transport,
        endpoint: pairing.endpoint || undefined,
        external_device_id: pairing.external_device_id,
        manufacturer: pairing.manufacturer || undefined,
        model: pairing.model || undefined,
      })

      await refreshData()
      toast.success(copy.success.matterDeviceCreated)
      closeWizard()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.matterCreate)
    } finally {
      setBusyAction(null)
    }
  }

  const syncModbusTelemetry = async () => {
    setBusyAction('sync')
    try {
      const result = await api.integrations.syncModbusTelemetry({
        baseUrl: connectionForm.baseUrl.trim() || undefined,
        apiKey: connectionForm.apiKey.trim() || undefined,
      })
      setSyncResult(result)
      await refreshData()
      toast.success(copy.success.syncTelemetry(result.importedSamples))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.syncTelemetry)
    } finally {
      setBusyAction(null)
    }
  }

  const discoverDevices = async () => {
    if (!wizardProtocol) {
      return
    }

    setBusyAction('discover')
    try {
      const results = await api.integrations.discoverDevices(wizardProtocol, {
        baseUrl: connectionForm.baseUrl.trim() || undefined,
        apiKey: connectionForm.apiKey.trim() || undefined,
      })
      setDiscoveredDevices(results)
      toast.success(locale === 'ro' ? 'Am actualizat lista de dispozitive din bridge.' : 'Bridge discovery completed.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.load)
    } finally {
      setBusyAction(null)
    }
  }

  const importDiscoveredMatterDevice = async (device: IntegrationDiscoveredDevice) => {
    if (!matterForm.roomId) {
      toast.error(copy.errors.matterRoomRequired)
      return
    }

    setBusyAction('import')
    try {
      await api.integrations.saveConnection('matter', buildConnectionPayload())
      await api.devices.create({
        name: device.name || matterForm.name || `${selectedProtocol?.label ?? 'Matter'} device`,
        type: resolveDiscoveredDeviceType(device.type, matterForm.type),
        room_id: matterForm.roomId,
        value: getDefaultDeviceValue(resolveDiscoveredDeviceType(device.type, matterForm.type)),
        status: getDefaultDeviceStatus(resolveDiscoveredDeviceType(device.type, matterForm.type)),
        unit: '',
        integration_protocol: 'matter',
        connection_transport: device.transport || matterForm.transport,
        external_device_id: device.external_device_id,
        manufacturer: device.manufacturer,
        model: device.model,
      })
      await refreshData()
      toast.success(copy.success.matterDeviceCreated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.matterCreate)
    } finally {
      setBusyAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="section-label text-gold">{copy.page.loading}</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="section-label mb-2">{copy.page.eyebrow}</div>
        <h1 className="page-title">{copy.page.title}</h1>
        <p className="mt-2 max-w-3xl font-body text-sm text-muted-foreground">{copy.page.description}</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3 sm:mb-8">
        {[
          { icon: Cable, label: copy.stats.integratedDevices, value: stats.integratedDevices },
          { icon: Cpu, label: copy.stats.protocols, value: stats.protocols },
          { icon: BatteryCharging, label: copy.stats.telemetrySources, value: stats.telemetrySources },
        ].map((item) => (
          <Card key={item.label} className="luxury-card p-5 sm:p-6">
            <item.icon className="mb-4 size-7 text-gold" />
            <div className="section-label mb-2">{item.label}</div>
            <div className="font-display text-3xl font-light text-foreground">{item.value}</div>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2 sm:mb-8 sm:gap-6">
        {(overview?.protocols ?? []).map((protocol) => {
          const canConfigure = protocol.code === 'matter' || protocol.code === 'modbus'

          return (
            <Card key={protocol.code} className="luxury-card p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="section-label mb-2 uppercase">{protocol.code}</div>
                  <h2 className={`font-display text-2xl font-light sm:text-3xl ${getProtocolAccent(protocol.code)}`}>{protocol.label}</h2>
                </div>
                <div className="rounded-full border border-gold/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-gold">
                  {protocol.status}
                </div>
              </div>

              <p className="mb-4 font-body text-sm text-muted-foreground">{protocol.description}</p>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="section-label mb-2">{copy.protocol.recommended}</div>
                  <p className="font-body text-sm text-foreground">{protocol.recommendedFor}</p>
                </div>
                <div>
                  <div className="section-label mb-2">{copy.protocol.transports}</div>
                  <p className="font-body text-sm text-foreground">
                    {protocol.transports.map((transport) => getTransportLabel(transport, locale)).join(', ') || '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <div className="section-label mb-2">{copy.protocol.devices(protocol.deviceCount)}</div>
                  <p className="font-body text-sm text-foreground">{protocol.deviceCount}</p>
                </div>
                <div>
                  <div className="section-label mb-2">{copy.protocol.configured}</div>
                  <p className="font-body text-sm text-foreground">
                    {protocol.isConfigured ? copy.protocol.configured : copy.protocol.notConfigured}
                  </p>
                </div>
                <div>
                  <div className="section-label mb-2">{copy.protocol.apiKey}</div>
                  <p className="font-body text-sm text-foreground">
                    {protocol.hasApiKey ? copy.protocol.apiKeySet : copy.protocol.apiKeyMissing}
                  </p>
                </div>
                <div>
                  <div className="section-label mb-2">{copy.protocol.telemetrySync}</div>
                  <p className="font-body text-sm text-foreground">
                    {protocol.telemetrySyncEnabled ? copy.protocol.telemetryOn : copy.protocol.telemetryOff}
                  </p>
                </div>
                <div>
                  <div className="section-label mb-2">{copy.protocol.syncInterval}</div>
                  <p className="font-body text-sm text-foreground">{protocol.telemetrySyncIntervalMinutes} min</p>
                </div>
                <div>
                  <div className="section-label mb-2">{copy.protocol.lastSync}</div>
                  <p className="font-body text-sm text-foreground">
                    {protocol.lastTelemetrySyncUtc ? formatDateTime(protocol.lastTelemetrySyncUtc) : '-'}
                  </p>
                </div>
              </div>

              {protocol.baseUrl ? (
                <div className="mt-4 rounded border border-gold-muted/40 bg-background/40 p-4">
                  <div className="section-label mb-2">{copy.protocol.bridgeUrl}</div>
                  <p className="font-body text-sm break-all text-foreground">{protocol.baseUrl}</p>
                </div>
              ) : (
                <p className="mt-4 font-body text-xs text-muted-foreground">{copy.protocol.configureHint}</p>
              )}

              {(protocol.connectionUpdatedUtc || protocol.lastTelemetrySyncStatus) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="section-label mb-2">{copy.protocol.updated}</div>
                    <p className="font-body text-sm text-foreground">
                      {protocol.connectionUpdatedUtc ? formatDateTime(protocol.connectionUpdatedUtc) : '-'}
                    </p>
                  </div>
                  <div>
                    <div className="section-label mb-2">{copy.protocol.lastStatus}</div>
                    <p className="font-body text-sm text-foreground">{protocol.lastTelemetrySyncStatus || '-'}</p>
                  </div>
                </div>
              )}

              {canConfigure && (
              <div className="mt-5">
                <Button
                  onClick={() => openWizard(protocol.code as WizardProtocol)}
                  className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto"
                >
                  <Plug className="mr-2 size-4" />
                  {copy.wizard.actions.configure}
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="luxury-card mb-6 p-4 sm:mb-8 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <SunMedium className="size-5 text-gold" />
          <h2 className="font-display text-2xl font-light text-foreground">{copy.telemetry.title}</h2>
        </div>

        {(overview?.telemetrySources.length ?? 0) === 0 ? (
          <p className="font-body text-sm text-muted-foreground">{copy.telemetry.empty}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview?.telemetrySources.map((source) => (
              <div key={source.sourceType} className="rounded border border-gold-muted/40 bg-background/30 p-4">
                <div className="section-label mb-2 uppercase">{source.sourceType}</div>
                <div className="font-display text-2xl text-gold">{source.sampleCount}</div>
                <p className="mt-2 font-body text-sm text-muted-foreground">{copy.telemetry.samples(source.sampleCount)}</p>
                {source.lastUpdatedUtc && (
                  <p className="mt-2 font-body text-xs text-muted-foreground">
                    {copy.telemetry.updated}: {formatDateTime(source.lastUpdatedUtc)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto">
          <Link to="/app/rooms?createDevice=1">{copy.actions.addDevice}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full border-gold text-gold hover:bg-gold/10 uppercase tracking-wider sm:w-auto">
          <Link to="/app/energy">
            {copy.actions.viewEnergy}
            <ChevronRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <Dialog open={wizardOpen} onOpenChange={(open) => (!open ? closeWizard() : setWizardOpen(open))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{copy.wizard.title(selectedProtocol?.label ?? 'Protocol')}</DialogTitle>
          </DialogHeader>

          <p className="font-body text-sm text-muted-foreground">
            {wizardProtocol === 'matter'
              ? copy.wizard.descriptions.matter
              : wizardProtocol === 'modbus'
                ? copy.wizard.descriptions.modbus
                : copy.wizard.descriptions.default}
          </p>

          <div className="mt-4 rounded border border-gold-muted/40 bg-background/30 p-5">
            <div className="section-label mb-4">{copy.wizard.sections.bridge}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{copy.wizard.fields.baseUrl}</Label>
                <Input
                  value={connectionForm.baseUrl}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, baseUrl: event.target.value }))}
                  placeholder={copy.wizard.hints.baseUrl}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{copy.wizard.fields.apiKey}</Label>
                <Input
                  type="password"
                  value={connectionForm.apiKey}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, apiKey: event.target.value }))}
                  placeholder={copy.wizard.hints.apiKey}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded border border-gold-muted/30 px-4 py-3">
                <div>
                  <div className="font-body text-sm text-foreground">{copy.wizard.fields.keepApiKey}</div>
                </div>
                <Switch
                  checked={connectionForm.preserveExistingApiKey}
                  onCheckedChange={(checked) => setConnectionForm((current) => ({ ...current, preserveExistingApiKey: checked }))}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded border border-gold-muted/30 px-4 py-3">
                <div>
                  <div className="font-body text-sm text-foreground">{copy.wizard.fields.clearApiKey}</div>
                </div>
                <Switch
                  checked={connectionForm.clearApiKey}
                  onCheckedChange={(checked) => setConnectionForm((current) => ({ ...current, clearApiKey: checked }))}
                />
              </div>
              {wizardProtocol === 'modbus' && (
                <>
                  <div className="flex items-center justify-between gap-4 rounded border border-gold-muted/30 px-4 py-3 md:col-span-2">
                    <div>
                      <div className="font-body text-sm text-foreground">{copy.wizard.fields.telemetrySyncEnabled}</div>
                    </div>
                    <Switch
                      checked={connectionForm.telemetrySyncEnabled}
                      onCheckedChange={(checked) => setConnectionForm((current) => ({ ...current, telemetrySyncEnabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{copy.wizard.fields.telemetrySyncIntervalMinutes}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      value={connectionForm.telemetrySyncIntervalMinutes}
                      onChange={(event) => setConnectionForm((current) => ({
                        ...current,
                        telemetrySyncIntervalMinutes: Number(event.target.value) || 15,
                      }))}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                onClick={saveConnection}
                disabled={!wizardProtocol || busyAction === 'save'}
                className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto"
              >
                {copy.wizard.actions.save}
              </Button>
              <Button
                onClick={testConnection}
                disabled={!wizardProtocol || busyAction === 'test'}
                variant="outline"
                className="w-full border-gold text-gold hover:bg-gold/10 uppercase tracking-wider sm:w-auto"
              >
                {copy.wizard.actions.test}
              </Button>
            </div>

            {testResult && (
              <div className="mt-4 rounded border border-gold-muted/30 bg-background/40 p-4">
                <div className="section-label mb-2">{copy.wizard.actions.test}</div>
                <p className={`font-body text-sm ${testResult.isReachable ? 'text-foreground' : 'text-destructive'}`}>
                  {testResult.message}
                </p>
                <p className="mt-2 font-body text-xs text-muted-foreground">
                  {formatDateTime(testResult.checkedAtUtc)}
                </p>
              </div>
            )}
          </div>

          {wizardProtocol === 'matter' && (
            <div className="mt-4 rounded border border-gold-muted/40 bg-background/30 p-5">
              <div className="section-label mb-4">{copy.wizard.sections.matter}</div>
              {rooms.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">{copy.errors.noRooms}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{copy.wizard.fields.pairingCode}</Label>
                    <Input
                      value={matterForm.pairingCode}
                      onChange={(event) => setMatterForm((current) => ({ ...current, pairingCode: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.wizard.fields.room}</Label>
                    <Select
                      value={matterForm.roomId}
                      onValueChange={(value) => setMatterForm((current) => ({ ...current, roomId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.wizard.fields.deviceName}</Label>
                    <Input
                      value={matterForm.name}
                      onChange={(event) => setMatterForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.wizard.fields.deviceType}</Label>
                    <Select
                      value={matterForm.type}
                      onValueChange={(value) => setMatterForm((current) => ({ ...current, type: value as Device['type'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {matterTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{copy.wizard.fields.transport}</Label>
                    <Select
                      value={matterForm.transport}
                      onValueChange={(value) => setMatterForm((current) => ({ ...current, transport: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {matterTransportOptions.map((transport) => (
                          <SelectItem key={transport} value={transport}>{getTransportLabel(transport, locale)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <p className="mt-4 font-body text-xs text-muted-foreground">{copy.wizard.hints.matterPairing}</p>

              <div className="mt-4">
                <Button
                  onClick={handleMatterPairAndCreate}
                  disabled={rooms.length === 0 || busyAction === 'pair'}
                  className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto"
                >
                  {copy.wizard.actions.pairAndCreate}
                </Button>
              </div>
            </div>
          )}

          {wizardProtocol === 'modbus' && (
            <div className="mt-4 rounded border border-gold-muted/40 bg-background/30 p-5">
              <div className="section-label mb-4">{copy.wizard.sections.modbus}</div>
              <p className="font-body text-sm text-muted-foreground">{copy.wizard.hints.modbusSync}</p>

              <div className="mt-4">
                <Button
                  onClick={syncModbusTelemetry}
                  disabled={busyAction === 'sync'}
                  className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto"
                >
                  {copy.wizard.actions.syncNow}
                </Button>
              </div>

              {syncResult && (
                <div className="mt-4 rounded border border-gold-muted/30 bg-background/40 p-4">
                  <div className="section-label mb-2">{copy.wizard.actions.syncNow}</div>
                  <p className="font-body text-sm text-foreground">{copy.success.syncTelemetry(syncResult.importedSamples)}</p>
                  <p className="mt-2 font-body text-xs text-muted-foreground">
                    {formatDateTime(syncResult.syncedAtUtc)}
                  </p>
                  <p className="mt-1 font-body text-xs text-muted-foreground">
                    {syncResult.sourceTypes.join(', ') || '-'}
                  </p>
                </div>
              )}
            </div>
          )}

          {(wizardProtocol === 'matter' || wizardProtocol === 'modbus') && (
            <div className="mt-4 rounded border border-gold-muted/40 bg-background/30 p-5">
              <div className="section-label mb-4">{copy.wizard.sections.discovery}</div>
              <div className="mb-4">
                <Button
                  onClick={discoverDevices}
                  disabled={busyAction === 'discover'}
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold/10 uppercase tracking-wider"
                >
                  {copy.wizard.actions.discover}
                </Button>
              </div>

              {discoveredDevices.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">
                  {locale === 'ro'
                    ? 'Nu am adus inca device-uri din bridge in aceasta sesiune.'
                    : 'No bridge devices have been loaded in this session yet.'}
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {discoveredDevices.map((device) => (
                    <div key={device.external_device_id} className="rounded border border-gold-muted/30 bg-background/40 p-4">
                      <div className="section-label mb-2 uppercase">{device.type || device.source_type || 'device'}</div>
                      <div className="font-display text-xl text-gold">{device.name || device.external_device_id}</div>
                      <p className="mt-2 font-body text-sm text-muted-foreground">{device.external_device_id}</p>
                      {(device.manufacturer || device.model) && (
                        <p className="mt-2 font-body text-xs text-muted-foreground">
                          {[device.manufacturer, device.model].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="mt-2 font-body text-xs text-muted-foreground">
                        {device.is_reachable ? 'Reachable' : 'Offline'}
                      </p>

                      {wizardProtocol === 'matter' ? (
                        <Button
                          onClick={() => importDiscoveredMatterDevice(device)}
                          disabled={busyAction === 'import' || rooms.length === 0}
                          className="mt-4 bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                        >
                          {copy.wizard.actions.importDiscovered}
                        </Button>
                      ) : (
                        <p className="mt-4 font-body text-xs text-muted-foreground">
                          {locale === 'ro'
                            ? 'Acest asset va fi inregistrat automat dupa sync-ul Modbus.'
                            : 'This asset will be registered automatically after the Modbus sync.'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="border-gold text-gold hover:bg-gold/10" onClick={closeWizard}>
              {copy.wizard.actions.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
