import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import type { Automation, Device, Room } from '@/types'
import { Clock, Pencil, Plus, Sparkles, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/context/I18nContext'

type ScheduleMode = 'time' | 'interval'

const AUTOMATIONS_COPY = {
  ro: {
    errors: {
      load: 'Nu am putut incarca automatizarile',
      devices: 'Nu am putut incarca dispozitivele',
      save: 'Nu am putut salva automatizarea',
      toggle: 'Nu am putut actualiza automatizarea',
      delete: 'Nu am putut sterge automatizarea',
      onboarding: 'Adauga mai intai cel putin un dispozitiv, apoi creeaza automatizarea.',
      nameRequired: 'Introdu numele automatizarii',
      deviceRequired: 'Selecteaza dispozitivul automatizarii',
    },
    success: {
      created: 'Automatizarea a fost creata',
      updated: 'Automatizarea a fost actualizata',
      deleted: 'Automatizarea a fost stearsa',
    },
    page: {
      eyebrow: 'AUTOMATIZARI',
      title: 'Rutinele tale.',
      add: 'Creeaza automatizare',
      loading: 'Se incarca...',
      emptyTitle: 'Nu exista automatizari inca.',
      emptyDescription: 'Creeaza prima rutina dupa ce ai camere si dispozitive configurate.',
    },
    list: {
      oneTime: 'O singura data',
      repeat: 'Recurent',
      edit: 'Editeaza',
      delete: 'Sterge',
      roomPrefix: 'Camera',
      enabled: 'Activata',
      disabled: 'Oprita',
      confirmDelete: (name: string) => `Esti sigur ca vrei sa stergi automatizarea "${name}"?`,
      everyMinutes: (minutes: number) => `La fiecare ${minutes} minute`,
      scheduledAt: (value: string) => `Programata pentru ${value}`,
      action: {
        TurnOn: 'Porneste',
        TurnOff: 'Opreste',
        SetValue: 'Seteaza valoarea',
      },
    },
    dialog: {
      createTitle: 'Creeaza automatizare',
      editTitle: 'Editeaza automatizarea',
      name: 'Nume',
      device: 'Dispozitiv',
      selectDevice: 'Selecteaza dispozitivul',
      action: 'Actiune',
      schedule: 'Programare',
      nextRun: 'Urmatoarea rulare',
      interval: 'Repeta la fiecare X minute',
      value: 'Valoare',
      enabled: 'Activata',
      cancel: 'Anuleaza',
      create: 'Creeaza',
      save: 'Salveaza',
      scheduleModes: {
        time: 'Ora fixa',
        interval: 'Interval repetitiv',
      },
    },
  },
  en: {
    errors: {
      load: 'Could not load automations',
      devices: 'Could not load devices',
      save: 'Could not save the automation',
      toggle: 'Could not update the automation',
      delete: 'Could not delete the automation',
      onboarding: 'Add at least one device first, then create the automation.',
      nameRequired: 'Enter the automation name',
      deviceRequired: 'Select the automation device',
    },
    success: {
      created: 'Automation created successfully',
      updated: 'Automation updated successfully',
      deleted: 'Automation deleted successfully',
    },
    page: {
      eyebrow: 'AUTOMATIONS',
      title: 'Your routines.',
      add: 'Create automation',
      loading: 'Loading...',
      emptyTitle: 'No automations yet.',
      emptyDescription: 'Create the first routine after rooms and devices are configured.',
    },
    list: {
      oneTime: 'One time',
      repeat: 'Recurring',
      edit: 'Edit',
      delete: 'Delete',
      roomPrefix: 'Room',
      enabled: 'Enabled',
      disabled: 'Disabled',
      confirmDelete: (name: string) => `Are you sure you want to delete the automation "${name}"?`,
      everyMinutes: (minutes: number) => `Every ${minutes} minutes`,
      scheduledAt: (value: string) => `Scheduled for ${value}`,
      action: {
        TurnOn: 'Turn on',
        TurnOff: 'Turn off',
        SetValue: 'Set value',
      },
    },
    dialog: {
      createTitle: 'Create automation',
      editTitle: 'Edit automation',
      name: 'Name',
      device: 'Device',
      selectDevice: 'Select device',
      action: 'Action',
      schedule: 'Schedule',
      nextRun: 'Next run',
      interval: 'Repeat every X minutes',
      value: 'Value',
      enabled: 'Enabled',
      cancel: 'Cancel',
      create: 'Create',
      save: 'Save',
      scheduleModes: {
        time: 'Fixed time',
        interval: 'Recurring interval',
      },
    },
  },
} as const

const toDateTimeLocalValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

const defaultNextRun = () => toDateTimeLocalValue(new Date(Date.now() + 3600000))

const DEFAULT_FORM = {
  name: '',
  deviceId: '',
  action: 'TurnOn',
  value: 0,
  nextRun: defaultNextRun(),
  interval: 60,
  enabled: true,
  scheduleMode: 'time' as ScheduleMode,
}

export const Automations: React.FC = () => {
  const { locale, formatDateTime } = useI18n()
  const copy = AUTOMATIONS_COPY[locale]
  const [searchParams, setSearchParams] = useSearchParams()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)

  const refreshData = useCallback(async () => {
    const [automationsData, devicesData, roomsData] = await Promise.all([
      api.automations.getAll(),
      api.devices.getAll(),
      api.rooms.getAll(),
    ])

    setAutomations(automationsData)
    setDevices(devicesData)
    setRooms(roomsData)
  }, [])

  useEffect(() => {
    refreshData()
      .catch(() => toast.error(copy.errors.load))
      .finally(() => setLoading(false))
  }, [copy.errors.load, refreshData])

  const openCreateDialog = useCallback(() => {
    if (devices.length === 0) {
      toast.error(copy.errors.onboarding)
      return
    }

    setEditingAutomation(null)
    setForm({
      ...DEFAULT_FORM,
      nextRun: defaultNextRun(),
      deviceId: devices[0]?.id ?? '',
    })
    setDialogOpen(true)
  }, [copy.errors.onboarding, devices])

  useEffect(() => {
    if (loading) {
      return
    }

    if (searchParams.get('create') !== '1') {
      return
    }

    openCreateDialog()
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('create')
    setSearchParams(nextSearchParams, { replace: true })
  }, [loading, openCreateDialog, searchParams, setSearchParams])

  const openEditDialog = (automation: Automation) => {
    setEditingAutomation(automation)
    setForm({
      name: automation.name,
      deviceId: automation.device_id ?? '',
      action: automation.action_type ?? 'TurnOn',
      value: automation.value ?? 0,
      nextRun: toDateTimeLocalValue(new Date(automation.trigger_value)),
      interval: automation.interval_minutes && automation.interval_minutes > 0 ? automation.interval_minutes : 60,
      enabled: automation.enabled,
      scheduleMode: automation.interval_minutes && automation.interval_minutes > 0 ? 'interval' : 'time',
    })
    setDialogOpen(true)
  }

  const automationCards = useMemo(() => automations.map((automation) => {
    const device = devices.find((candidate) => candidate.id === automation.device_id)
    const room = rooms.find((candidate) => candidate.id === (automation.room_id ?? device?.room_id))
    const scheduleSummary = automation.interval_minutes && automation.interval_minutes > 0
      ? copy.list.everyMinutes(automation.interval_minutes)
      : copy.list.scheduledAt(formatDateTime(automation.trigger_value))

    return {
      automation,
      device,
      room,
      scheduleSummary,
    }
  }), [automations, copy.list, devices, formatDateTime, rooms])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error(copy.errors.nameRequired)
      return
    }

    if (!form.deviceId) {
      toast.error(copy.errors.deviceRequired)
      return
    }

    const selectedDevice = devices.find((device) => device.id === form.deviceId)
    const payload: Partial<Automation> = {
      name: form.name.trim(),
      device_id: form.deviceId,
      room_id: selectedDevice?.room_id,
      action_type: form.action,
      trigger_type: form.scheduleMode,
      trigger_value: form.nextRun,
      value: form.action === 'SetValue' ? form.value : undefined,
      interval_minutes: form.scheduleMode === 'interval' ? form.interval : 0,
      enabled: form.enabled,
    }

    try {
      if (editingAutomation) {
        const updated = await api.automations.update(editingAutomation.id, payload)
        setAutomations((previous) => previous.map((candidate) => candidate.id === editingAutomation.id ? updated : candidate))
        toast.success(copy.success.updated)
      } else {
        const created = await api.automations.create(payload)
        setAutomations((previous) => [...previous, created])
        toast.success(copy.success.created)
      }

      await refreshData()
      setDialogOpen(false)
    } catch {
      toast.error(copy.errors.save)
    }
  }

  const handleToggle = async (automation: Automation) => {
    try {
      const updated = await api.automations.update(automation.id, { ...automation, enabled: !automation.enabled })
      setAutomations((previous) => previous.map((candidate) => candidate.id === automation.id ? updated : candidate))
    } catch {
      toast.error(copy.errors.toggle)
    }
  }

  const handleDelete = async (automation: Automation) => {
    if (!confirm(copy.list.confirmDelete(automation.name))) return

    try {
      await api.automations.delete(automation.id)
      setAutomations((previous) => previous.filter((candidate) => candidate.id !== automation.id))
      toast.success(copy.success.deleted)
    } catch {
      toast.error(copy.errors.delete)
    }
  }

  const automationStats = {
    total: automations.length,
    enabled: automations.filter((automation) => automation.enabled).length,
    recurring: automations.filter((automation) => (automation.interval_minutes ?? 0) > 0).length,
    coveredDevices: new Set(automations.map((automation) => automation.device_id).filter(Boolean)).size,
  }

  if (loading) {
    return <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4"><div className="text-gold section-label">{copy.page.loading}</div></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="section-label mb-2">{copy.page.eyebrow}</div>
          <h1 className="page-title">{copy.page.title}</h1>
        </div>
        <Button onClick={openCreateDialog} className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider sm:w-auto">
          <Plus className="mr-2 size-4" />
          {copy.page.add}
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: locale === 'ro' ? 'Automatizari totale' : 'Total automations', value: automationStats.total },
          { label: copy.list.enabled, value: automationStats.enabled },
          { label: copy.list.repeat, value: automationStats.recurring },
          { label: locale === 'ro' ? 'Dispozitive acoperite' : 'Covered devices', value: automationStats.coveredDevices },
        ].map((item) => (
          <Card key={item.label} className="luxury-card p-5 sm:p-6">
            <div className="section-label mb-2">{item.label}</div>
            <div className="font-display text-3xl font-light text-foreground">{item.value}</div>
          </Card>
        ))}
      </div>

      {automationCards.length === 0 ? (
        <Card className="luxury-card p-8 text-center sm:p-12">
          <Sparkles className="mx-auto mb-4 size-12 text-gold" />
          <p className="mb-2 font-display text-2xl text-muted-foreground">{copy.page.emptyTitle}</p>
          <p className="mb-6 font-body text-sm text-muted-foreground">{copy.page.emptyDescription}</p>
          <Button onClick={openCreateDialog} className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
            <Plus className="mr-2 size-4" />
            {copy.page.add}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {automationCards.map(({ automation, device, room, scheduleSummary }) => (
            <Card
              key={automation.id}
              className="luxury-card p-4 sm:p-6"
              style={{ borderLeft: automation.enabled ? '2px solid #C9A84C' : '2px solid #2A2A2A' }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="card-title text-foreground">{automation.name}</h3>
                    <Switch
                      checked={automation.enabled}
                      onCheckedChange={() => handleToggle(automation)}
                      className="data-[state=checked]:bg-gold"
                    />
                    <Badge variant="outline" className="border-gold text-gold uppercase text-xs">
                      {automation.enabled ? copy.list.enabled : copy.list.disabled}
                    </Badge>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-gold" />
                      <span>{scheduleSummary}</span>
                    </div>
                    {room && <span>{copy.list.roomPrefix}: {room.name}</span>}
                    {device && <span>{device.name}</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Zap className="size-4 text-gold" />
                    <Badge variant="outline" className="border-gold text-gold uppercase text-xs">
                      {copy.list.action[automation.action_type as keyof typeof copy.list.action] ?? automation.action_type}
                    </Badge>
                    {automation.value !== undefined && (
                      <Badge variant="outline" className="border-gold text-gold uppercase text-xs">
                        {automation.value}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-gold text-gold uppercase text-xs">
                      {automation.interval_minutes && automation.interval_minutes > 0 ? copy.list.repeat : copy.list.oneTime}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 self-start lg:self-auto">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(automation)} className="text-gold hover:text-gold-light">
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(automation)} className="text-destructive hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAutomation ? copy.dialog.editTitle : copy.dialog.createTitle}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="auto-name">{copy.dialog.name}</Label>
              <Input id="auto-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>

            <div className="grid gap-2">
              <Label>{copy.dialog.device}</Label>
              <Select value={form.deviceId} onValueChange={(value) => setForm((current) => ({ ...current, deviceId: value }))}>
                <SelectTrigger><SelectValue placeholder={copy.dialog.selectDevice} /></SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{copy.dialog.action}</Label>
              <Select value={form.action} onValueChange={(value) => setForm((current) => ({ ...current, action: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TurnOn">{copy.list.action.TurnOn}</SelectItem>
                  <SelectItem value="TurnOff">{copy.list.action.TurnOff}</SelectItem>
                  <SelectItem value="SetValue">{copy.list.action.SetValue}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.action === 'SetValue' && (
              <div className="grid gap-2">
                <Label htmlFor="auto-value">{copy.dialog.value}</Label>
                <Input id="auto-value" type="number" value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: Number(event.target.value) }))} />
              </div>
            )}

            <div className="grid gap-2">
              <Label>{copy.dialog.schedule}</Label>
              <Select value={form.scheduleMode} onValueChange={(value) => setForm((current) => ({ ...current, scheduleMode: value as ScheduleMode }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">{copy.dialog.scheduleModes.time}</SelectItem>
                  <SelectItem value="interval">{copy.dialog.scheduleModes.interval}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="auto-next-run">{copy.dialog.nextRun}</Label>
              <Input id="auto-next-run" type="datetime-local" value={form.nextRun} onChange={(event) => setForm((current) => ({ ...current, nextRun: event.target.value }))} />
            </div>

            {form.scheduleMode === 'interval' && (
              <div className="grid gap-2">
                <Label htmlFor="auto-interval">{copy.dialog.interval}</Label>
                <Input id="auto-interval" type="number" value={form.interval} min={1} onChange={(event) => setForm((current) => ({ ...current, interval: Number(event.target.value) }))} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(value) => setForm((current) => ({ ...current, enabled: value }))} />
              <Label>{copy.dialog.enabled}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{copy.dialog.cancel}</Button>
            <Button onClick={handleSubmit} className="bg-gold text-background hover:bg-gold-light">
              {editingAutomation ? copy.dialog.save : copy.dialog.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
