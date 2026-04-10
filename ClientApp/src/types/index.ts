export interface Device {
  id: string
  room_id?: string
  name: string
  type: 'bulb' | 'thermostat' | 'tv' | 'lock' | 'motion' | 'door' | 'camera' | 'speaker' | 'plug' | 'ac' | 'blinds'
  status: boolean
  value: number
  unit: string
  created_at?: string
  updated_at?: string
}

export interface Room {
  id: string
  name: string
  devices?: Device[]
  active_count?: number
  total_count?: number
  created_at?: string
  updated_at?: string
}

export interface Automation {
  id: string
  name: string
  trigger_type: string
  trigger_value: string
  action_type: string
  device_id?: string
  room_id?: string
  value?: number
  interval_minutes?: number
  device?: Device
  enabled: boolean
  created_at?: string
}

export interface ActivityLog {
  id: string
  device_id?: string
  device?: Device
  action: string
  details: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'alert'
  read: boolean
  created_at: string
}

export interface EnergyData {
  id: string
  device_id?: string
  device?: Device
  consumption: number
  cost: number
  date: string
  created_at?: string
}

export interface DashboardStats {
  total_devices: number
  active_devices: number
  total_rooms: number
  energy_today: number
  trend: {
    devices: number
    energy: number
  }
}

export interface AuthUser {
  username: string
  token: string
}

export interface RegisterRequest {
  username: string
  displayName: string
  email: string
  password: string
}
