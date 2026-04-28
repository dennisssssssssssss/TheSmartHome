export interface Device {
  id: string
  room_id?: string
  name: string
  type: 'bulb' | 'thermostat' | 'tv' | 'lock' | 'motion' | 'door' | 'camera' | 'speaker' | 'plug' | 'ac' | 'blinds'
  category?: string
  integration_protocol?: string
  connection_transport?: string
  external_device_id?: string
  endpoint?: string
  manufacturer?: string
  model?: string
  last_seen_at?: string
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

export interface EnergyAsset {
  id: string
  name: string
  kind: string
  source_type: string
  integration_protocol: string
  external_asset_id?: string
  manufacturer?: string
  model?: string
  is_active: boolean
  last_telemetry_utc?: string
  current_power_watts?: number
  state_of_charge_percent?: number
}

export interface EnergyOverview {
  current: {
    solar_power_watts: number
    home_load_watts: number
    grid_power_watts: number
    battery_power_watts: number
    battery_state_of_charge_percent?: number
    last_updated_utc?: string
  }
  today: {
    solar_wh: number
    home_wh: number
    grid_import_wh: number
    grid_export_wh: number
    battery_charge_wh: number
    battery_discharge_wh: number
  }
  timeline: Array<{
    timestamp_utc: string
    solar_power_watts: number
    home_load_watts: number
    grid_power_watts: number
    battery_power_watts: number
    battery_state_of_charge_percent?: number
  }>
}

export interface DeviceIntegrationOption {
  code: string
  label: string
  status: string
  description: string
  recommendedFor: string
  transports: string[]
}

export interface MatterPairingResult {
  external_device_id: string
  suggested_name?: string
  suggested_type?: string
  manufacturer?: string
  model?: string
  endpoint?: string
  transport: string
  protocol: string
  is_reachable: boolean
}

export interface IntegrationConnection {
  protocol: string
  baseUrl?: string
  hasApiKey: boolean
  telemetrySyncEnabled: boolean
  telemetrySyncIntervalMinutes: number
  updatedAtUtc?: string
  lastTelemetrySyncUtc?: string
  lastTelemetrySyncStatus?: string
}

export interface IntegrationConnectionUpsertRequest {
  baseUrl?: string
  apiKey?: string
  preserveExistingApiKey?: boolean
  clearApiKey?: boolean
  telemetrySyncEnabled: boolean
  telemetrySyncIntervalMinutes: number
}

export interface IntegrationConnectionTestRequest {
  baseUrl?: string
  apiKey?: string
}

export interface IntegrationConnectionTestResult {
  isReachable: boolean
  message: string
  checkedAtUtc: string
}

export interface IntegrationDiscoveredDevice {
  external_device_id: string
  name?: string
  type?: string
  manufacturer?: string
  model?: string
  transport?: string
  source_type?: string
  is_reachable: boolean
}

export interface ModbusTelemetrySyncResult {
  importedSamples: number
  sourceTypes: string[]
  syncedAtUtc: string
}

export interface IntegrationProtocolOverview {
  code: string
  label: string
  status: string
  description: string
  recommendedFor: string
  transports: string[]
  deviceCount: number
  isConfigured: boolean
  baseUrl?: string
  hasApiKey: boolean
  telemetrySyncEnabled: boolean
  telemetrySyncIntervalMinutes: number
  connectionUpdatedUtc?: string
  lastTelemetrySyncUtc?: string
  lastTelemetrySyncStatus?: string
}

export interface IntegrationTelemetrySource {
  sourceType: string
  sampleCount: number
  lastUpdatedUtc?: string
}

export interface IntegrationOverview {
  protocols: IntegrationProtocolOverview[]
  telemetrySources: IntegrationTelemetrySource[]
  totalIntegratedDevices: number
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
