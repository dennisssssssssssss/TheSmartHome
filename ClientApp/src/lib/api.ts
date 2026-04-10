import type { Device, Room, Automation, ActivityLog, Notification, EnergyData, DashboardStats, AuthUser, RegisterRequest } from '@/types'
import { decodeJwtPayload } from '@/lib/jwt'

const resolveApiBase = (): string => {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredBase) {
    return configuredBase.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return 'http://localhost:5110'
    }

    return window.location.origin.replace(/\/$/, '')
  }

  return 'http://localhost:5110'
}

export const API_BASE = resolveApiBase()

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function parseErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const data = payload as Record<string, unknown>
  if (typeof data.message === 'string') return data.message
  if (typeof data.errorMessage === 'string') return data.errorMessage
  if (typeof data.title === 'string') return data.title

  return null
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    return parseErrorMessage(payload) || `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}

function toApiError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage)
}

function extractDeviceId(details: unknown): string | undefined {
  if (typeof details !== 'string') {
    return undefined
  }

  const match = details.match(/DeviceId=(\d+)/i)
  return match?.[1]
}

function getDailyEnergyTotals(entries: EnergyData[]): number[] {
  const totalsByDay = new Map<string, number>()

  for (const entry of entries) {
    const key = entry.date.slice(0, 10)
    totalsByDay.set(key, (totalsByDay.get(key) ?? 0) + entry.consumption)
  }

  return [...totalsByDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, total]) => total)
}

function toUtcIsoString(value: string | undefined): string | undefined {
  if (!value) return undefined

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  return parsed.toISOString()
}

function persistAuthSession(data: { token: string; username?: string }, fallbackUsername: string): AuthUser {
  localStorage.setItem('auth_token', data.token)

  const payload = decodeJwtPayload(data.token)
  const resolvedUsername = typeof data.username === 'string' && data.username.trim().length > 0
    ? data.username
    : typeof payload.sub === 'string' && payload.sub.trim().length > 0
      ? payload.sub
      : fallbackUsername

  const authUser = { username: resolvedUsername, token: data.token }
  localStorage.setItem('username', authUser.username)

  return authUser
}

function mapDeviceType(type: string): Device['type'] {
  const map: Record<string, Device['type']> = {
    'Lampa': 'bulb',
    'Termostat': 'thermostat',
    'Tv': 'tv',
    'Aer Conditionat': 'ac',
    'Incuietoare': 'lock',
    'Senzor': 'motion',
    'Camera': 'camera',
    'Boxa': 'speaker',
    'Jaluzele': 'blinds',
    'Priza': 'plug',
  }
  return map[type] || 'bulb'
}

function reverseMapDeviceType(type: Device['type']): string {
  const map: Record<string, string> = {
    'bulb': 'Lampa',
    'thermostat': 'Termostat',
    'tv': 'Tv',
    'ac': 'Aer Conditionat',
    'lock': 'Incuietoare',
    'motion': 'Senzor',
    'plug': 'Priza',
    'door': 'Senzor',
    'camera': 'Camera',
    'speaker': 'Boxa',
    'blinds': 'Jaluzele',
  }
  return map[type] || 'Lampa'
}

function toBackendDevice(device: Partial<Device>) {
  return {
    name: device.name,
    type: device.type ? reverseMapDeviceType(device.type) : undefined,
    isOn: device.status,
    value: device.value,
    roomId: device.room_id ? Number(device.room_id) : null,
  }
}

function mapDevice(d: any): Device {
  return {
    id: String(d.id),
    status: d.isOn,
    room_id: d.roomId != null ? String(d.roomId) : undefined,
    unit: d.sensorUnit || '',
    value: d.value,
    name: d.name,
    type: mapDeviceType(d.type),
  }
}

export const api = {
  auth: {
    login: async (username: string, password: string): Promise<AuthUser> => {
      const response = await fetch(`${API_BASE}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const data = await response.json()
      return persistAuthSession(data, username)
    },

    register: async (registration: RegisterRequest): Promise<AuthUser> => {
      const response = await fetch(`${API_BASE}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registration),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      const data = await response.json()
      return persistAuthSession(data, registration.username)
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/api/Auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }
    },

    logout: () => {
      localStorage.removeItem('auth_token')
    },

    isAuthenticated: (): boolean => {
      return !!getAuthToken()
    },
  },

  rooms: {
    getAll: async (): Promise<Room[]> => {
      try {
        const response = await fetch(`${API_BASE}/api/Rooms`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return data.map((r: any) => ({
          id: String(r.id),
          name: r.name,
          active_count: r.devices?.filter((d: any) => d.isOn).length || 0,
          total_count: r.deviceCount || 0,
        }))
      } catch (error) {
        console.error('API error loading rooms:', error)
        throw toApiError(error, 'Failed to load rooms')
      }
    },

    create: async (room: Partial<Room>): Promise<Room> => {
      try {
        const response = await fetch(`${API_BASE}/api/Rooms`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(room),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const r = await response.json()
        return { id: String(r.id), name: r.name, active_count: 0, total_count: 0 }
      } catch (error) {
        console.error('API error creating room:', error)
        throw toApiError(error, 'Failed to create room')
      }
    },

    update: async (id: string, room: Partial<Room>): Promise<Room> => {
      try {
        const response = await fetch(`${API_BASE}/api/Rooms/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(room),
        })
        if (response.status === 204) {
          return { id, ...room } as Room
        }

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        return await response.json()
      } catch (error) {
        console.error('API error updating room:', error)
        throw toApiError(error, 'Failed to update room')
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/api/Rooms/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        if (!response.ok && response.status !== 204) {
          throw new Error(await getErrorMessage(response))
        }
      } catch (error) {
        console.error('API error deleting room:', error)
        throw toApiError(error, 'Failed to delete room')
      }
    },
  },

  devices: {
    getAll: async (): Promise<Device[]> => {
      try {
        const response = await fetch(`${API_BASE}/api/Devices`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return data.map(mapDevice)
      } catch (error) {
        console.error('API error loading devices:', error)
        throw toApiError(error, 'Failed to load devices')
      }
    },

    getById: async (id: string): Promise<Device | null> => {
      try {
        const response = await fetch(`${API_BASE}/api/Devices/${id}`, {
          headers: getAuthHeaders(),
        })
        if (response.status === 404) {
          return null
        }

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return mapDevice(data)
      } catch (error) {
        console.error(`API error loading device ${id}:`, error)
        throw toApiError(error, 'Failed to load device')
      }
    },

    create: async (device: Partial<Device>): Promise<Device> => {
      try {
        const response = await fetch(`${API_BASE}/api/Devices`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(toBackendDevice(device)),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return mapDevice(data)
      } catch (error) {
        console.error('API error creating device:', error)
        throw toApiError(error, 'Failed to create device')
      }
    },

    update: async (id: string, device: Partial<Device>): Promise<Device> => {
      try {
        const response = await fetch(`${API_BASE}/api/Devices/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(toBackendDevice(device)),
        })
        if (response.status === 204) {
          return { id, ...device } as Device
        }

        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return mapDevice(data)
      } catch (error) {
        console.error(`API error updating device ${id}:`, error)
        throw toApiError(error, 'Failed to update device')
      }
    },

    control: async (id: string, command: { status?: boolean; value?: number }): Promise<Device> => {
      try {
        if (command.status !== undefined) {
          const response = await fetch(`${API_BASE}/api/Devices/${id}/control`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ command: command.status ? 'TurnOn' : 'TurnOff' }),
          })

          if (!response.ok && response.status !== 204) {
            throw new Error(await getErrorMessage(response))
          }

          if (command.value === undefined) {
            const device = await api.devices.getById(id)
            if (device) return device
          }
        }

        if (command.value !== undefined) {
          const response = await fetch(`${API_BASE}/api/Devices/${id}/control`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ command: 'SetValue', value: command.value }),
          })

          if (!response.ok && response.status !== 204) {
            throw new Error(await getErrorMessage(response))
          }

          const device = await api.devices.getById(id)
          if (device) return { ...device, value: command.value }
        }
      } catch (error) {
        console.error(`API error controlling device ${id}:`, error)
        throw toApiError(error, 'Failed to control device')
      }

      throw new Error('No device control command was provided')
    },

    delete: async (id: string): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/api/Devices/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        if (!response.ok && response.status !== 204) {
          throw new Error(await getErrorMessage(response))
        }
      } catch (error) {
        console.error(`API error deleting device ${id}:`, error)
        throw toApiError(error, 'Failed to delete device')
      }
    },
  },

  automations: {
    getAll: async (): Promise<Automation[]> => {
      try {
        const response = await fetch(`${API_BASE}/api/Automations`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return data.map((r: any) => ({
          id: String(r.id),
          name: r.name,
          device_id: r.deviceId ? String(r.deviceId) : undefined,
          room_id: r.roomId ? String(r.roomId) : undefined,
          action_type: r.action,
          trigger_type: r.intervalMinutes > 0 ? 'interval' : 'time',
          trigger_value: r.nextRunUtc,
          value: r.value ?? undefined,
          interval_minutes: r.intervalMinutes,
          enabled: r.enabled,
        }))
      } catch (error) {
        console.error('API error loading automations:', error)
        throw toApiError(error, 'Failed to load automations')
      }
    },

    create: async (automation: Partial<Automation>): Promise<Automation> => {
      try {
        const payload = {
          name: automation.name,
          deviceId: automation.device_id ? Number(automation.device_id) : null,
          roomId: automation.room_id ? Number(automation.room_id) : null,
          action: automation.action_type || '',
          value: automation.value ?? null,
          nextRunUtc: toUtcIsoString(automation.trigger_value) || new Date().toISOString(),
          intervalMinutes: automation.interval_minutes ?? 0,
          enabled: automation.enabled ?? true,
        }
        const response = await fetch(`${API_BASE}/api/Automations`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const r = await response.json()
        return {
          id: String(r.id),
          name: r.name,
          device_id: r.deviceId ? String(r.deviceId) : undefined,
          room_id: r.roomId ? String(r.roomId) : undefined,
          action_type: r.action,
          trigger_type: r.intervalMinutes > 0 ? 'interval' : 'time',
          trigger_value: r.nextRunUtc,
          value: r.value ?? undefined,
          interval_minutes: r.intervalMinutes,
          enabled: r.enabled,
        } as Automation
      } catch (error) {
        console.error('API error creating automation:', error)
        throw toApiError(error, 'Failed to create automation')
      }
    },

    update: async (id: string, automation: Partial<Automation>): Promise<Automation> => {
      try {
        const payload = {
          name: automation.name,
          deviceId: automation.device_id ? Number(automation.device_id) : null,
          roomId: automation.room_id ? Number(automation.room_id) : null,
          action: automation.action_type || '',
          value: automation.value ?? null,
          nextRunUtc: toUtcIsoString(automation.trigger_value) || new Date().toISOString(),
          intervalMinutes: automation.interval_minutes ?? 0,
          enabled: automation.enabled ?? true,
        }
        const response = await fetch(`${API_BASE}/api/Automations/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        if (!response.ok && response.status !== 204) {
          throw new Error(await getErrorMessage(response))
        }

        return { id, ...automation } as Automation
      } catch (error) {
        console.error(`API error updating automation ${id}:`, error)
        throw toApiError(error, 'Failed to update automation')
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE}/api/Automations/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
        if (!response.ok && response.status !== 204) {
          throw new Error(await getErrorMessage(response))
        }
      } catch (error) {
        console.error(`API error deleting automation ${id}:`, error)
        throw toApiError(error, 'Failed to delete automation')
      }
    },
  },

  logs: {
    getAll: async (): Promise<ActivityLog[]> => {
      try {
        const response = await fetch(`${API_BASE}/api/Logs`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return data.map((item: any) => ({
          id: String(item.id),
          action: item.action,
          details: item.details,
          created_at: item.timestampUtc,
          device_id: extractDeviceId(item.details),
        }))
      } catch (error) {
        console.error('API error loading logs:', error)
        throw toApiError(error, 'Failed to load logs')
      }
    },
  },

  notifications: {
    getAll: async (): Promise<Notification[]> => {
      try {
        const response = await fetch(`${API_BASE}/api/Notifications`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }

        const data = await response.json()
        return data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          type: n.type,
          read: n.read,
          created_at: n.createdAt,
        }))
      } catch (error) {
        console.error('API error loading notifications:', error)
        throw toApiError(error, 'Failed to load notifications')
      }
    },

    markAsRead: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/api/Notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      if (!response.ok && response.status !== 204) {
        throw new Error(await getErrorMessage(response))
      }
    },

    markAllAsRead: async (): Promise<void> => {
      const response = await fetch(`${API_BASE}/api/Notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      if (!response.ok && response.status !== 204) {
        throw new Error(await getErrorMessage(response))
      }
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/api/Notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok && response.status !== 204) {
        throw new Error(await getErrorMessage(response))
      }
    },
  },

  energy: {
    getSummary: async (): Promise<{ data: EnergyData[]; total: number }> => {
      try {
        const response = await fetch(`${API_BASE}/api/Energy/summary`, {
          headers: getAuthHeaders(),
        })
        if (!response.ok) {
          throw new Error(await getErrorMessage(response))
        }
        return await response.json()
      } catch (error) {
        console.error('API error loading energy summary:', error)
        throw toApiError(error, 'Failed to load energy summary')
      }
    },
  },

  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      const devices = await api.devices.getAll()
      const rooms = await api.rooms.getAll()
      const energy = await api.energy.getSummary()
      const dailyEnergyTotals = getDailyEnergyTotals(energy.data)
      const energyToday = dailyEnergyTotals.at(-1) ?? 0
      const previousDayEnergy = dailyEnergyTotals.at(-2) ?? 0
      const energyTrend = previousDayEnergy > 0
        ? Math.round(((energyToday - previousDayEnergy) / previousDayEnergy) * 100)
        : 0

      return {
        total_devices: devices.length,
        active_devices: devices.filter((d) => d.status).length,
        total_rooms: rooms.length,
        energy_today: energyToday,
        trend: {
          devices: 0,
          energy: energyTrend,
        },
      }
    },
  },
}
