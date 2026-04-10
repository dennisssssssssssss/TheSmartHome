import type { Automation, Device } from '@/types'

export const AUTO_LOCK_RULE_PREFIX = 'System Auto-Lock'
export const AUTO_LOCK_HOUR = 22
export const AUTO_LOCK_MINUTE = 0
export const AUTO_LOCK_INTERVAL_MINUTES = 24 * 60

export function isAutoLockRule(automation: Automation): boolean {
  return automation.name.startsWith(AUTO_LOCK_RULE_PREFIX)
}

export function getAutoLockRuleName(device: Device): string {
  return `${AUTO_LOCK_RULE_PREFIX}: ${device.name}`
}

export function getNextAutoLockRunValue(now = new Date()): string {
  const nextRun = new Date(now)
  nextRun.setSeconds(0, 0)
  nextRun.setHours(AUTO_LOCK_HOUR, AUTO_LOCK_MINUTE, 0, 0)

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1)
  }

  return nextRun.toISOString()
}

export function getSecurityDeviceTypeLabel(type: Device['type']): string {
  switch (type) {
    case 'lock':
      return 'lock'
    case 'camera':
      return 'camera'
    case 'motion':
      return 'motion sensor'
    case 'door':
      return 'door sensor'
    default:
      return type
  }
}
