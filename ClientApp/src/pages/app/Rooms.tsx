import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { Device, Room, DeviceIntegrationOption } from '@/types'
import { ChevronDown, ChevronUp, Home, Pencil, Plus, Shield, Trash2, Zap } from 'lucide-react'
import { DeviceIllustration } from '@/components/device-illustrations'
import { toast } from 'sonner'
import { useSearch } from '@/context/SearchContext'
import { useSignalR } from '@/hooks/useSignalR'
import { useI18n } from '@/context/I18nContext'
import {
  getIntegrationProtocolLabel,
  getIntegrationStatusLabel,
  getRoomDeviceStatusText,
  getRoomDeviceTypeLabel,
  getRoomsContent,
  getTransportLabel,
} from '@/lib/i18n/rooms'

const DEVICE_TYPE_VALUES: Device['type'][] = ['bulb', 'thermostat', 'tv', 'ac', 'lock', 'camera', 'motion', 'plug', 'speaker', 'blinds']

const AMBIENT_DEVICE_TYPES: Device['type'][] = ['bulb', 'thermostat', 'tv', 'ac', 'plug', 'speaker', 'blinds']
const VALUE_DEVICE_TYPES: Device['type'][] = ['bulb', 'thermostat', 'ac', 'speaker', 'blinds']
const DEFAULT_DEVICE_FORM = {
  name: '',
  type: 'bulb' as Device['type'],
  room_id: '',
  value: 0,
  status: false,
  integration_protocol: 'simulated',
  connection_transport: 'wifi',
  endpoint: '',
  external_device_id: '',
  manufacturer: '',
  model: '',
  pairing_code: '',
}

type RoomSection = {
  id: string
  name: string
  devices: Device[]
}

export const Rooms: React.FC = () => {
  const { locale } = useI18n()
  const copy = getRoomsContent(locale)
  const [searchParams, setSearchParams] = useSearchParams()
  const [devices, setDevices] = useState<Device[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [integrationOptions, setIntegrationOptions] = useState<DeviceIntegrationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deviceForm, setDeviceForm] = useState(DEFAULT_DEVICE_FORM)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const sliderTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { searchQuery } = useSearch()

  const deviceTypeOptions = useMemo(() => DEVICE_TYPE_VALUES.map((type) => ({
    value: type,
    label: getRoomDeviceTypeLabel(type, locale),
  })), [locale])

  const integrationSelectOptions = useMemo(() => integrationOptions.map((option) => ({
    value: option.code,
    label: option.label,
    status: getIntegrationStatusLabel(option.status, locale),
  })), [integrationOptions, locale])

  const selectedIntegrationOption = useMemo(
    () => integrationOptions.find((option) => option.code === deviceForm.integration_protocol) ?? null,
    [deviceForm.integration_protocol, integrationOptions],
  )

  const transportOptions = useMemo(
    () => (selectedIntegrationOption?.transports ?? []).map((transport) => ({
      value: transport,
      label: getTransportLabel(transport, locale),
    })),
    [locale, selectedIntegrationOption],
  )

  const refreshData = useCallback(async () => {
    const [devicesData, roomsData] = await Promise.all([
      api.devices.getAll(),
      api.rooms.getAll(),
    ])

    setDevices(devicesData)
    setRooms(roomsData)
    setExpandedRooms((current) => {
      const nextState = { ...current }

      for (const room of roomsData) {
        if (!(room.id in nextState)) {
          nextState[room.id] = true
        }
      }

      return nextState
    })
  }, [])

  useSignalR({ onUpdate: refreshData })

  function openAddDeviceDialog(roomId?: string) {
    if (rooms.length === 0) {
      toast.error(copy.errors.createRoomFirst)
      return
    }

    setEditingDevice(null)
    setDeviceForm({
      ...DEFAULT_DEVICE_FORM,
      room_id: roomId ?? rooms[0]?.id ?? '',
    })
    setDeviceDialogOpen(true)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deviceOptions] = await Promise.all([
          api.devices.getIntegrationOptions(),
          refreshData(),
        ])
        setIntegrationOptions(deviceOptions)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.errors.integrationLoad)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [copy.errors.integrationLoad, refreshData])

  useEffect(() => {
    if (loading) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    let changed = false

    if (searchParams.get('createRoom') === '1') {
      setRoomDialogOpen(true)
      nextSearchParams.delete('createRoom')
      changed = true
    }

    if (searchParams.get('createDevice') === '1') {
      if (rooms.length === 0) {
        setRoomDialogOpen(true)
        toast.error(copy.errors.createRoomBeforeDevices)
      } else {
        openAddDeviceDialog()
      }

      nextSearchParams.delete('createDevice')
      changed = true
    }

    if (changed) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [copy.errors.createRoomBeforeDevices, loading, rooms.length, searchParams, setSearchParams])

  useEffect(() => {
    return () => {
      for (const timer of Object.values(sliderTimersRef.current)) {
        clearTimeout(timer)
      }
    }
  }, [])

  const roomSections = useMemo<RoomSection[]>(() => {
    return rooms
      .map((room) => ({
        id: room.id,
        name: room.name,
        devices: devices.filter((device) => device.room_id === room.id),
      }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [devices, rooms])

  const knownRoomIds = new Set(roomSections.map((room) => room.id))
  const unassignedDevices = devices.filter((device) => !device.room_id || !knownRoomIds.has(device.room_id))

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return roomSections
    }

    return roomSections.flatMap((room) => {
      const roomMatches = room.name.toLowerCase().includes(query)
      const matchingDevices = room.devices.filter((device) => {
        const haystack = `${device.name} ${getRoomDeviceTypeLabel(device.type, locale)}`.toLowerCase()
        return haystack.includes(query)
      })

      if (!roomMatches && matchingDevices.length === 0) {
        return []
      }

      return [{
        ...room,
        devices: roomMatches ? room.devices : matchingDevices,
      }]
    })
  }, [locale, roomSections, searchQuery])

  const filteredUnassignedDevices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return unassignedDevices
    }

    return unassignedDevices.filter((device) => {
      const haystack = `${device.name} ${getRoomDeviceTypeLabel(device.type, locale)}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [locale, searchQuery, unassignedDevices])

  const totalSecurityDevices = devices.filter((device) => ['lock', 'camera', 'motion', 'door'].includes(device.type)).length
  const totalActiveDevices = devices.filter((device) => device.status).length

  const openEditDeviceDialog = (device: Device) => {
    setEditingDevice(device)
    setDeviceForm({
      name: device.name,
      type: device.type,
      room_id: device.room_id || '',
      value: device.value,
      status: device.status,
      integration_protocol: device.integration_protocol || 'simulated',
      connection_transport: device.connection_transport || 'wifi',
      endpoint: device.endpoint || '',
      external_device_id: device.external_device_id || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      pairing_code: '',
    })
    setDeviceDialogOpen(true)
  }

  const handleIntegrationProtocolChange = (value: string) => {
    const integration = integrationOptions.find((option) => option.code === value)
    setDeviceForm((current) => ({
      ...current,
      integration_protocol: value,
      connection_transport: integration?.transports[0] ?? current.connection_transport,
      pairing_code: value === 'matter' ? current.pairing_code : '',
    }))
  }

  const handlePairMatter = async () => {
    if (!deviceForm.pairing_code.trim()) {
      toast.error(copy.errors.matterPairingCodeRequired)
      return
    }

    try {
      const result = await api.devices.pairMatter({
        pairing_code: deviceForm.pairing_code.trim(),
        bridge_base_url: deviceForm.endpoint.trim() || undefined,
        transport: deviceForm.connection_transport || undefined,
        name: deviceForm.name.trim() || undefined,
        type: deviceForm.type,
      })

      setDeviceForm((current) => ({
        ...current,
        name: current.name || result.suggested_name || current.name,
        type: result.suggested_type ? current.type : current.type,
        endpoint: result.endpoint || current.endpoint,
        external_device_id: result.external_device_id,
        manufacturer: result.manufacturer || current.manufacturer,
        model: result.model || current.model,
        connection_transport: result.transport || current.connection_transport,
      }))

      toast.success(copy.success.matterPaired)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.matterPairing)
    }
  }

  const toggleRoomExpanded = (roomId: string) => {
    setExpandedRooms((current) => ({
      ...current,
      [roomId]: !current[roomId],
    }))
  }

  const handleAddRoom = async () => {
    if (!roomName.trim()) {
      toast.error(copy.errors.roomNameRequired)
      return
    }

    try {
      const created = await api.rooms.create({ name: roomName.trim() })
      setRooms((previous) => [...previous, created])
      setExpandedRooms((current) => ({ ...current, [created.id]: true }))
      setRoomDialogOpen(false)
      setRoomName('')
      toast.success(copy.success.roomCreated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.roomCreate)
    }
  }

  const handleDeviceFormSubmit = async () => {
    if (!deviceForm.name.trim()) {
      toast.error(copy.errors.deviceNameRequired)
      return
    }

    if (!deviceForm.room_id) {
      toast.error(copy.errors.deviceRoomRequired)
      return
    }

    if (deviceForm.integration_protocol === 'matter' && !deviceForm.external_device_id.trim()) {
      toast.error(copy.errors.matterExternalIdRequired)
      return
    }

    try {
      const payload = {
        name: deviceForm.name.trim(),
        type: deviceForm.type,
        room_id: deviceForm.room_id,
        value: deviceForm.value,
        status: deviceForm.status,
        unit: '',
        integration_protocol: deviceForm.integration_protocol,
        connection_transport: deviceForm.connection_transport || undefined,
        endpoint: deviceForm.endpoint.trim() || undefined,
        external_device_id: deviceForm.external_device_id.trim() || undefined,
        manufacturer: deviceForm.manufacturer.trim() || undefined,
        model: deviceForm.model.trim() || undefined,
      }

      if (editingDevice) {
        await api.devices.update(editingDevice.id, payload)
      } else {
        await api.devices.create(payload)
      }

      await refreshData()
      setDeviceDialogOpen(false)
      toast.success(editingDevice ? copy.success.deviceUpdated : copy.success.deviceCreated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.deviceSave)
    }
  }

  const handleDeleteDevice = async (device: Device) => {
    if (!confirm(copy.actions.confirmDelete(device.name))) {
      return
    }

    try {
      await api.devices.delete(device.id)
      await refreshData()
      toast.success(copy.success.deviceDeleted)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.deviceDelete)
    }
  }

  const handleToggleDevice = async (device: Device) => {
    try {
      const updated = await api.devices.control(device.id, { status: !device.status })
      setDevices((previous) => previous.map((candidate) => candidate.id === updated.id ? updated : candidate))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.deviceUpdate)
    }
  }

  const handleRoomComfortToggle = async (room: RoomSection) => {
    const ambientDevices = room.devices.filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))

    if (ambientDevices.length === 0) {
      toast.error(copy.errors.comfortUnavailable)
      return
    }

    const nextStatus = !ambientDevices.some((device) => device.status)

    try {
      await Promise.all(
        ambientDevices.map((device) => api.devices.control(device.id, { status: nextStatus })),
      )

      await refreshData()
      toast.success(nextStatus ? copy.success.roomComfortOn : copy.success.roomComfortOff)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.errors.roomUpdate)
    }
  }

  const handleValueChange = useCallback((device: Device, value: number) => {
    setDevices((previous) => previous.map((candidate) => candidate.id === device.id ? { ...candidate, value } : candidate))

    const existingTimer = sliderTimersRef.current[device.id]
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    sliderTimersRef.current[device.id] = setTimeout(async () => {
      try {
        await api.devices.control(device.id, { value })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : copy.errors.valueUpdate)
      }
    }, 400)
  }, [copy.errors.valueUpdate])

  const renderDeviceCard = (device: Device) => {
    const roomNameForDevice = roomSections.find((room) => room.id === device.room_id)?.name

    return (
      <Card
        key={device.id}
        className={`luxury-card overflow-hidden transition-all duration-400 ${device.status ? 'device-on' : 'device-off'}`}
      >
        <div
          className="flex h-28 items-center justify-center sm:h-32"
          style={{ backgroundColor: device.status ? 'rgba(22, 20, 16, 0.3)' : '#0A0A0A' }}
        >
          <DeviceIllustration type={device.type} isOn={device.status} value={device.value} />
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="card-title truncate text-foreground">{device.name}</h3>
              <p className="section-label mt-1 text-xs">
                {roomNameForDevice ?? copy.fallback.unassigned}
              </p>
              <p className="mt-2 font-body text-xs text-muted-foreground">
                {getIntegrationProtocolLabel(device.integration_protocol, locale)}
                {device.connection_transport ? ` · ${getTransportLabel(device.connection_transport, locale)}` : ''}
              </p>
            </div>
            <Switch
              checked={device.status}
              onCheckedChange={() => handleToggleDevice(device)}
              className="shrink-0 data-[state=checked]:bg-gold"
            />
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="font-body text-sm uppercase tracking-wider text-muted-foreground">
              {getRoomDeviceTypeLabel(device.type, locale)}
            </span>
            <span className="font-display text-xl text-gold">
              {getRoomDeviceStatusText(device, locale)}
            </span>
          </div>

          {VALUE_DEVICE_TYPES.includes(device.type) && device.status && (
            <div className="mb-4">
              <Slider
                value={[device.value]}
                onValueChange={([value]) => handleValueChange(device, value)}
                max={device.type === 'thermostat' || device.type === 'ac' ? 30 : 100}
                min={device.type === 'thermostat' || device.type === 'ac' ? 15 : 0}
                step={1}
                className="[&_[data-slot=slider-track]]:bg-muted [&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
              />
            </div>
          )}

          <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center" style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDeviceDialog(device)}
              className="flex-1 text-xs text-gold hover:text-gold-light"
            >
              <Pencil className="mr-1 size-3" />
              {copy.actions.edit}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDevice(device)}
              className="flex-1 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 size-3" />
              {copy.actions.delete}
            </Button>
          </div>
        </div>
      </Card>
    )
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
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="section-label mb-2">{copy.page.eyebrow}</div>
          <h1 className="page-title">{copy.page.title}</h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-muted-foreground">{copy.page.description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            onClick={() => setRoomDialogOpen(true)}
            variant="outline"
            className="w-full border-gold text-gold hover:bg-gold/10 uppercase tracking-wider sm:w-auto"
          >
            <Plus className="mr-2 size-4" />
            {copy.page.addRoom}
          </Button>
          <Button
            onClick={() => openAddDeviceDialog()}
            className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto"
          >
            <Plus className="mr-2 size-4" />
            {copy.page.addDevice}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:mb-8 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Home, label: copy.stats.rooms, value: rooms.length },
          { icon: Zap, label: copy.stats.devices, value: devices.length },
          { icon: Shield, label: copy.stats.activeDevices, value: totalActiveDevices },
          { icon: Shield, label: copy.stats.securityDevices, value: totalSecurityDevices },
        ].map((item) => (
          <Card key={item.label} className="luxury-card p-5 sm:p-6">
            <item.icon className="mb-4 size-7 text-gold" />
            <div className="section-label mb-2">{item.label}</div>
            <div className="font-display text-3xl font-light text-foreground">{item.value}</div>
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && filteredUnassignedDevices.length === 0 ? (
        <Card className="luxury-card p-8 text-center sm:p-12">
          <p className="mb-2 font-display text-2xl text-muted-foreground">
            {rooms.length === 0 ? copy.empty.noRooms : copy.empty.noSearchResults}
          </p>
          <p className="mb-6 font-body text-sm text-muted-foreground">
            {rooms.length === 0 ? copy.empty.noRoomsDescription : copy.empty.noSearchDescription}
          </p>
          <Button
            onClick={() => rooms.length === 0 ? setRoomDialogOpen(true) : openAddDeviceDialog()}
            className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
          >
            <Plus className="mr-2 size-4" />
            {rooms.length === 0 ? copy.empty.addFirstRoom : copy.page.addDevice}
          </Button>
        </Card>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {filteredSections.map((room) => {
            const ambientDevices = room.devices.filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))
            const activeDevices = room.devices.filter((device) => device.status).length
            const securityDevices = room.devices.filter((device) => ['lock', 'camera', 'motion', 'door'].includes(device.type)).length
            const isExpanded = expandedRooms[room.id] ?? true

            return (
              <Card key={room.id} className="luxury-card p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 section-label">{copy.room.eyebrow}</div>
                    <h2 className="font-display text-2xl font-light text-foreground sm:text-3xl">{room.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-4 font-body text-sm text-muted-foreground">
                      <span>{copy.room.devices(room.devices.length)}</span>
                      <span>{copy.room.active(activeDevices)}</span>
                      <span>{copy.room.security(securityDevices)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Button
                      variant="outline"
                      onClick={() => handleRoomComfortToggle(room)}
                      className="w-full border-gold text-gold hover:bg-gold/10 uppercase tracking-wider sm:w-auto"
                    >
                      {ambientDevices.some((device) => device.status)
                        ? copy.room.turnOffAmbient
                        : copy.room.turnOnAmbient}
                    </Button>
                    <Button
                      onClick={() => openAddDeviceDialog(room.id)}
                      className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto"
                    >
                      <Plus className="mr-2 size-4" />
                      {copy.page.addDevice}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRoomExpanded(room.id)}
                      className="text-gold hover:text-gold-light"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  room.devices.length === 0 ? (
                    <div className="rounded border border-gold-muted/50 bg-background/40 p-6 text-center">
                      <p className="mb-2 font-display text-xl text-muted-foreground">
                        {copy.room.noConfiguration}
                      </p>
                      <p className="mb-4 font-body text-sm text-muted-foreground">
                        {copy.room.noConfigurationDescription(room.name)}
                      </p>
                      <Button
                        onClick={() => openAddDeviceDialog(room.id)}
                        className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                      >
                        <Plus className="mr-2 size-4" />
                        {copy.page.addDevice}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {room.devices.map(renderDeviceCard)}
                    </div>
                  )
                )}
              </Card>
            )
          })}

          {filteredUnassignedDevices.length > 0 && (
            <Card className="luxury-card p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 section-label">{copy.fallback.eyebrow}</div>
                  <h2 className="font-display text-2xl font-light text-foreground sm:text-3xl">{copy.fallback.title}</h2>
                  <p className="mt-2 font-body text-sm text-muted-foreground">{copy.fallback.description}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredUnassignedDevices.map(renderDeviceCard)}
              </div>
            </Card>
          )}
        </div>
      )}

      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingDevice ? copy.dialogs.editDevice : copy.dialogs.addDevice}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="device-name">{copy.dialogs.labels.name}</Label>
              <Input
                id="device-name"
                value={deviceForm.name}
                onChange={(event) => setDeviceForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>{copy.dialogs.labels.type}</Label>
              <Select value={deviceForm.type} onValueChange={(value) => setDeviceForm((current) => ({ ...current, type: value as Device['type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {deviceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{copy.dialogs.labels.room}</Label>
              <Select value={deviceForm.room_id} onValueChange={(value) => setDeviceForm((current) => ({ ...current, room_id: value }))}>
                <SelectTrigger><SelectValue placeholder={copy.dialogs.labels.selectRoom} /></SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded border border-gold-muted/40 bg-background/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">{copy.dialogs.sections.integration}</p>
                  <p className="mt-2 font-body text-xs text-muted-foreground">
                    {selectedIntegrationOption?.description}
                  </p>
                </div>
                <div className="rounded-full border border-gold/30 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gold">
                  {copy.dialogs.labels.integrationStatus}: {selectedIntegrationOption ? getIntegrationStatusLabel(selectedIntegrationOption.status, locale) : '-'}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>{copy.dialogs.labels.protocol}</Label>
                  <Select value={deviceForm.integration_protocol} onValueChange={handleIntegrationProtocolChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {integrationSelectOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label} {option.status ? `(${option.status})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{copy.dialogs.labels.transport}</Label>
                  <Select
                    value={deviceForm.connection_transport}
                    onValueChange={(value) => setDeviceForm((current) => ({ ...current, connection_transport: value }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {transportOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="mt-3 font-body text-xs text-muted-foreground">
                {deviceForm.integration_protocol === 'matter' ? copy.dialogs.hints.matter : copy.dialogs.hints.manual}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="device-endpoint">{copy.dialogs.labels.endpoint}</Label>
              <Input
                id="device-endpoint"
                placeholder={copy.dialogs.placeholders.endpoint}
                value={deviceForm.endpoint}
                onChange={(event) => setDeviceForm((current) => ({ ...current, endpoint: event.target.value }))}
              />
            </div>

            {deviceForm.integration_protocol === 'matter' && (
              <div className="rounded border border-gold-muted/40 bg-background/30 p-4">
                <div className="mb-3">
                  <p className="section-label">{copy.dialogs.sections.pairing}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="grid gap-2">
                    <Label htmlFor="matter-pairing-code">{copy.dialogs.labels.pairingCode}</Label>
                    <Input
                      id="matter-pairing-code"
                      placeholder={copy.dialogs.placeholders.pairingCode}
                      value={deviceForm.pairing_code}
                      onChange={(event) => setDeviceForm((current) => ({ ...current, pairing_code: event.target.value }))}
                    />
                  </div>
                  <Button onClick={handlePairMatter} className="bg-gold text-background hover:bg-gold-light">
                    {copy.dialogs.actions.pairMatter}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="device-external-id">{copy.dialogs.labels.externalId}</Label>
                <Input
                  id="device-external-id"
                  value={deviceForm.external_device_id}
                  onChange={(event) => setDeviceForm((current) => ({ ...current, external_device_id: event.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="device-manufacturer">{copy.dialogs.labels.manufacturer}</Label>
                <Input
                  id="device-manufacturer"
                  value={deviceForm.manufacturer}
                  onChange={(event) => setDeviceForm((current) => ({ ...current, manufacturer: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="device-model">{copy.dialogs.labels.model}</Label>
              <Input
                id="device-model"
                value={deviceForm.model}
                onChange={(event) => setDeviceForm((current) => ({ ...current, model: event.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="device-value">{copy.dialogs.labels.value}</Label>
              <Input
                id="device-value"
                type="number"
                value={deviceForm.value}
                onChange={(event) => setDeviceForm((current) => ({ ...current, value: Number(event.target.value) }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={deviceForm.status}
                onCheckedChange={(value) => setDeviceForm((current) => ({ ...current, status: value }))}
              />
              <Label>{copy.dialogs.labels.poweredOn}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceDialogOpen(false)}>{copy.dialogs.actions.cancel}</Button>
            <Button onClick={handleDeviceFormSubmit} className="bg-gold text-background hover:bg-gold-light">
              {editingDevice ? copy.dialogs.actions.save : copy.dialogs.actions.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{copy.dialogs.addRoom}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="room-name">{copy.dialogs.labels.roomName}</Label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>{copy.dialogs.actions.cancel}</Button>
            <Button onClick={handleAddRoom} className="bg-gold text-background hover:bg-gold-light">{copy.dialogs.actions.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
