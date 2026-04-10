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
import type { Device, Room } from '@/types'
import { ChevronDown, ChevronUp, Home, Pencil, Plus, Shield, Trash2, Zap } from 'lucide-react'
import { DeviceIllustration } from '@/components/device-illustrations'
import { toast } from 'sonner'
import { useSearch } from '@/context/SearchContext'
import { useSignalR } from '@/hooks/useSignalR'
import { useI18n } from '@/context/I18nContext'

const DEVICE_TYPE_VALUES: Device['type'][] = ['bulb', 'thermostat', 'tv', 'ac', 'lock', 'camera', 'motion', 'plug', 'speaker', 'blinds']

const AMBIENT_DEVICE_TYPES: Device['type'][] = ['bulb', 'thermostat', 'tv', 'ac', 'plug', 'speaker', 'blinds']
const VALUE_DEVICE_TYPES: Device['type'][] = ['bulb', 'thermostat', 'ac', 'speaker', 'blinds']
const DEFAULT_DEVICE_FORM = { name: '', type: 'bulb' as Device['type'], room_id: '', value: 0, status: false }

type RoomSection = {
  id: string
  name: string
  devices: Device[]
}

function getDeviceTypeLabel(type: Device['type'], locale: 'ro' | 'en') {
  const labels = locale === 'ro'
    ? {
        bulb: 'Bec',
        thermostat: 'Termostat',
        tv: 'TV',
        ac: 'Aer conditionat',
        lock: 'Incuietoare',
        camera: 'Camera',
        motion: 'Senzor miscare',
        plug: 'Priza inteligenta',
        speaker: 'Boxa',
        blinds: 'Jaluzele',
        door: 'Senzor usa',
      }
    : {
        bulb: 'Bulb',
        thermostat: 'Thermostat',
        tv: 'TV',
        ac: 'Air conditioner',
        lock: 'Lock',
        camera: 'Camera',
        motion: 'Motion sensor',
        plug: 'Smart plug',
        speaker: 'Speaker',
        blinds: 'Blinds',
        door: 'Door sensor',
      }

  return labels[type] ?? type
}

function getDeviceStatusText(device: Device, locale: 'ro' | 'en') {
  if (device.type === 'lock') {
    return locale === 'ro' ? (device.status ? 'Incuiata' : 'Descuiata') : (device.status ? 'Locked' : 'Unlocked')
  }

  if (device.type === 'camera') {
    return device.status ? 'Online' : 'Offline'
  }

  if (device.type === 'motion' || device.type === 'door') {
    return locale === 'ro' ? (device.status ? 'Activ' : 'Inactiv') : (device.status ? 'Active' : 'Inactive')
  }

  if (VALUE_DEVICE_TYPES.includes(device.type)) {
    if (device.type === 'thermostat' || device.type === 'ac') {
      return `${device.value}°C`
    }

    return `${device.value}%`
  }

  return locale === 'ro' ? (device.status ? 'Pornit' : 'Oprit') : (device.status ? 'On' : 'Off')
}

export const Rooms: React.FC = () => {
  const { locale } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const [devices, setDevices] = useState<Device[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deviceForm, setDeviceForm] = useState(DEFAULT_DEVICE_FORM)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const sliderTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const { searchQuery } = useSearch()
  const isRomanian = locale === 'ro'
  const deviceTypeOptions = useMemo(() => DEVICE_TYPE_VALUES.map((type) => ({
    value: type,
    label: getDeviceTypeLabel(type, locale),
  })), [locale])

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

  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshData()
      } catch (error) {
        toast.error(isRomanian ? 'Nu am putut incarca camerele si dispozitivele' : 'Could not load rooms and devices')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isRomanian, refreshData])

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
        toast.error(isRomanian ? 'Creeaza prima camera, apoi adauga dispozitivele in ea.' : 'Create the first room, then add devices inside it.')
      } else {
        openAddDeviceDialog()
      }

      nextSearchParams.delete('createDevice')
      changed = true
    }

    if (changed) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [isRomanian, loading, openAddDeviceDialog, rooms.length, searchParams, setSearchParams])

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
        const haystack = `${device.name} ${getDeviceTypeLabel(device.type, locale)}`.toLowerCase()
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
      const haystack = `${device.name} ${getDeviceTypeLabel(device.type, locale)}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [locale, searchQuery, unassignedDevices])

  const totalSecurityDevices = devices.filter((device) => ['lock', 'camera', 'motion', 'door'].includes(device.type)).length
  const totalActiveDevices = devices.filter((device) => device.status).length

  function openAddDeviceDialog(roomId?: string) {
    if (rooms.length === 0) {
      toast.error(isRomanian ? 'Creeaza mai intai o camera' : 'Create a room first')
      return
    }

    setEditingDevice(null)
    setDeviceForm({
      ...DEFAULT_DEVICE_FORM,
      room_id: roomId ?? rooms[0]?.id ?? '',
    })
    setDeviceDialogOpen(true)
  }

  const openEditDeviceDialog = (device: Device) => {
    setEditingDevice(device)
    setDeviceForm({
      name: device.name,
      type: device.type,
      room_id: device.room_id || '',
      value: device.value,
      status: device.status,
    })
    setDeviceDialogOpen(true)
  }

  const toggleRoomExpanded = (roomId: string) => {
    setExpandedRooms((current) => ({
      ...current,
      [roomId]: !current[roomId],
    }))
  }

  const handleAddRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Introdu numele camerei')
      return
    }

    try {
      const created = await api.rooms.create({ name: roomName.trim() })
      setRooms((previous) => [...previous, created])
      setExpandedRooms((current) => ({ ...current, [created.id]: true }))
      setRoomDialogOpen(false)
      setRoomName('')
      toast.success('Camera a fost adaugata')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut crea camera')
    }
  }

  const handleDeviceFormSubmit = async () => {
    if (!deviceForm.name.trim()) {
      toast.error('Introdu numele dispozitivului')
      return
    }

    if (!deviceForm.room_id) {
      toast.error('Alege camera pentru dispozitiv')
      return
    }

    try {
      if (editingDevice) {
        await api.devices.update(editingDevice.id, {
          name: deviceForm.name.trim(),
          type: deviceForm.type,
          room_id: deviceForm.room_id,
          value: deviceForm.value,
          status: deviceForm.status,
          unit: '',
        })
      } else {
        await api.devices.create({
          name: deviceForm.name.trim(),
          type: deviceForm.type,
          room_id: deviceForm.room_id,
          value: deviceForm.value,
          status: deviceForm.status,
          unit: '',
        })
      }

      await refreshData()
      setDeviceDialogOpen(false)
      toast.success(editingDevice ? 'Dispozitiv actualizat' : 'Dispozitiv adaugat')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut salva dispozitivul')
    }
  }

  const handleDeleteDevice = async (device: Device) => {
    if (!confirm(`Esti sigur ca vrei sa stergi ${device.name}?`)) {
      return
    }

    try {
      await api.devices.delete(device.id)
      await refreshData()
      toast.success('Dispozitiv sters')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut sterge dispozitivul')
    }
  }

  const handleToggleDevice = async (device: Device) => {
    try {
      const updated = await api.devices.control(device.id, { status: !device.status })
      setDevices((previous) => previous.map((candidate) => candidate.id === updated.id ? updated : candidate))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut actualiza dispozitivul')
    }
  }

  const handleRoomComfortToggle = async (room: RoomSection) => {
    const ambientDevices = room.devices.filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))

    if (ambientDevices.length === 0) {
      toast.error('Camera nu are dispozitive de confort')
      return
    }

    const nextStatus = !ambientDevices.some((device) => device.status)

    try {
      await Promise.all(
        ambientDevices.map((device) => api.devices.control(device.id, { status: nextStatus })),
      )

      await refreshData()
      toast.success(nextStatus ? 'Dispozitivele au fost pornite' : 'Dispozitivele au fost oprite')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut actualiza camera')
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
        toast.error(error instanceof Error ? error.message : 'Nu am putut actualiza valoarea dispozitivului')
      }
    }, 400)
  }, [])

  const renderDeviceCard = (device: Device) => {
    const roomNameForDevice = roomSections.find((room) => room.id === device.room_id)?.name

    return (
      <Card
        key={device.id}
        className={`luxury-card overflow-hidden transition-all duration-400 ${device.status ? 'device-on' : 'device-off'}`}
      >
        <div
          className="flex h-32 items-center justify-center"
          style={{ backgroundColor: device.status ? 'rgba(22, 20, 16, 0.3)' : '#0A0A0A' }}
        >
          <DeviceIllustration type={device.type} isOn={device.status} value={device.value} />
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="card-title truncate text-foreground">{device.name}</h3>
              <p className="section-label mt-1 text-xs">
                {roomNameForDevice ?? (isRomanian ? 'Neatribuit' : 'Unassigned')}
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
              {getDeviceTypeLabel(device.type, locale)}
            </span>
            <span className="font-display text-xl text-gold">
              {getDeviceStatusText(device, locale)}
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

          <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDeviceDialog(device)}
              className="flex-1 text-xs text-gold hover:text-gold-light"
            >
              <Pencil className="mr-1 size-3" />
              {isRomanian ? 'Editeaza' : 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteDevice(device)}
              className="flex-1 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 size-3" />
              {isRomanian ? 'Sterge' : 'Delete'}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="section-label text-gold">{isRomanian ? 'Se incarca...' : 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="section-label mb-2">{isRomanian ? 'CAMERE' : 'ROOMS'}</div>
          <h1 className="page-title">{isRomanian ? 'Casa ta, organizata pe camere.' : 'Your home, organized by room.'}</h1>
          <p className="mt-2 max-w-2xl font-body text-sm text-muted-foreground">
            {isRomanian
              ? 'Creezi camerele mai intai, apoi adaugi si administrezi dispozitivele direct in contextul fiecarei camere.'
              : 'Create the rooms first, then add and manage devices directly inside each room.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setRoomDialogOpen(true)}
            variant="outline"
            className="border-gold text-gold hover:bg-gold/10 uppercase tracking-wider"
          >
            <Plus className="mr-2 size-4" />
            {isRomanian ? 'Adauga camera' : 'Add room'}
          </Button>
          <Button
            onClick={() => openAddDeviceDialog()}
            className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
          >
            <Plus className="mr-2 size-4" />
            {isRomanian ? 'Adauga dispozitiv' : 'Add device'}
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Home, label: isRomanian ? 'Camere' : 'Rooms', value: rooms.length },
          { icon: Zap, label: isRomanian ? 'Dispozitive' : 'Devices', value: devices.length },
          { icon: Shield, label: isRomanian ? 'Dispozitive active' : 'Active devices', value: totalActiveDevices },
          { icon: Shield, label: isRomanian ? 'Dispozitive securitate' : 'Security devices', value: totalSecurityDevices },
        ].map((item) => (
          <Card key={item.label} className="luxury-card p-6">
            <item.icon className="mb-4 size-7 text-gold" />
            <div className="section-label mb-2">{item.label}</div>
            <div className="font-display text-3xl font-light text-foreground">{item.value}</div>
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && filteredUnassignedDevices.length === 0 ? (
        <Card className="luxury-card p-12 text-center">
          <p className="mb-2 font-display text-2xl text-muted-foreground">
            {rooms.length === 0
              ? (isRomanian ? 'Nu ai camere create inca.' : 'You do not have any rooms yet.')
              : (isRomanian ? 'Nu am gasit rezultate pentru cautarea ta.' : 'No results matched your search.')}
          </p>
          <p className="mb-6 font-body text-sm text-muted-foreground">
            {rooms.length === 0
              ? (isRomanian
                  ? 'Incepe prin a crea camerele, apoi adauga dispozitivele in fiecare dintre ele.'
                  : 'Start by creating the rooms, then add devices inside each one.')
              : (isRomanian
                  ? 'Incearca alt nume de camera sau alt tip de dispozitiv.'
                  : 'Try another room name or device type.')}
          </p>
          <Button
            onClick={() => rooms.length === 0 ? setRoomDialogOpen(true) : openAddDeviceDialog()}
            className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
          >
            <Plus className="mr-2 size-4" />
            {rooms.length === 0
              ? (isRomanian ? 'Adauga prima camera' : 'Add the first room')
              : (isRomanian ? 'Adauga dispozitiv' : 'Add device')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((room) => {
            const ambientDevices = room.devices.filter((device) => AMBIENT_DEVICE_TYPES.includes(device.type))
            const activeDevices = room.devices.filter((device) => device.status).length
            const securityDevices = room.devices.filter((device) => ['lock', 'camera', 'motion', 'door'].includes(device.type)).length
            const isExpanded = expandedRooms[room.id] ?? true

            return (
              <Card key={room.id} className="luxury-card p-6">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 section-label">{isRomanian ? 'CAMERA' : 'ROOM'}</div>
                    <h2 className="font-display text-3xl font-light text-foreground">{room.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-4 font-body text-sm text-muted-foreground">
                      <span>{isRomanian ? `${room.devices.length} dispozitive` : `${room.devices.length} devices`}</span>
                      <span>{isRomanian ? `${activeDevices} active` : `${activeDevices} active`}</span>
                      <span>{isRomanian ? `${securityDevices} de securitate` : `${securityDevices} security`}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleRoomComfortToggle(room)}
                      className="border-gold text-gold hover:bg-gold/10 uppercase tracking-wider"
                    >
                      {ambientDevices.some((device) => device.status)
                        ? (isRomanian ? 'Opreste ambientul' : 'Turn off ambient')
                        : (isRomanian ? 'Porneste ambientul' : 'Turn on ambient')}
                    </Button>
                    <Button
                      onClick={() => openAddDeviceDialog(room.id)}
                      className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                    >
                      <Plus className="mr-2 size-4" />
                      {isRomanian ? 'Adauga dispozitiv' : 'Add device'}
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
                        {isRomanian ? 'Nicio configurare inca.' : 'No configuration yet.'}
                      </p>
                      <p className="mb-4 font-body text-sm text-muted-foreground">
                        {isRomanian
                          ? `Adauga primul dispozitiv in ${room.name} pentru a incepe configurarea.`
                          : `Add the first device in ${room.name} to start configuring the room.`}
                      </p>
                      <Button
                        onClick={() => openAddDeviceDialog(room.id)}
                        className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                      >
                        <Plus className="mr-2 size-4" />
                        {isRomanian ? 'Adauga dispozitiv' : 'Add device'}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {room.devices.map(renderDeviceCard)}
                    </div>
                  )
                )}
              </Card>
            )
          })}

          {filteredUnassignedDevices.length > 0 && (
            <Card className="luxury-card p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 section-label">FALLBACK</div>
                  <h2 className="font-display text-3xl font-light text-foreground">{isRomanian ? 'Neatribuite.' : 'Unassigned.'}</h2>
                  <p className="mt-2 font-body text-sm text-muted-foreground">
                    {isRomanian
                      ? 'Aceste dispozitive exista in sistem, dar nu mai sunt legate de o camera valida.'
                      : 'These devices still exist in the system, but are no longer linked to a valid room.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredUnassignedDevices.map(renderDeviceCard)}
              </div>
            </Card>
          )}
        </div>
      )}

      <Dialog open={deviceDialogOpen} onOpenChange={setDeviceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDevice
              ? (isRomanian ? 'Editeaza dispozitivul' : 'Edit device')
              : (isRomanian ? 'Adauga dispozitiv' : 'Add device')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="device-name">{isRomanian ? 'Nume' : 'Name'}</Label>
              <Input
                id="device-name"
                value={deviceForm.name}
                onChange={(event) => setDeviceForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>{isRomanian ? 'Tip' : 'Type'}</Label>
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
              <Label>{isRomanian ? 'Camera' : 'Room'}</Label>
              <Select value={deviceForm.room_id} onValueChange={(value) => setDeviceForm((current) => ({ ...current, room_id: value }))}>
                <SelectTrigger><SelectValue placeholder={isRomanian ? 'Selecteaza camera' : 'Select room'} /></SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="device-value">{isRomanian ? 'Valoare' : 'Value'}</Label>
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
              <Label>{isRomanian ? 'Pornit' : 'Powered on'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeviceDialogOpen(false)}>{isRomanian ? 'Anuleaza' : 'Cancel'}</Button>
            <Button onClick={handleDeviceFormSubmit} className="bg-gold text-background hover:bg-gold-light">
              {editingDevice
                ? (isRomanian ? 'Salveaza' : 'Save')
                : (isRomanian ? 'Creeaza' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRomanian ? 'Adauga camera' : 'Add room'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="room-name">{isRomanian ? 'Nume camera' : 'Room name'}</Label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>{isRomanian ? 'Anuleaza' : 'Cancel'}</Button>
            <Button onClick={handleAddRoom} className="bg-gold text-background hover:bg-gold-light">{isRomanian ? 'Creeaza' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
