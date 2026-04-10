const PREFERENCE_EVENT = 'nexus-preferences-changed'

export const NOTIFICATIONS_PREFERENCE_KEY = 'nexus-notifications'
export const AUTO_LOCK_PREFERENCE_KEY = 'nexus-autolock'
export const LOCALE_PREFERENCE_KEY = 'nexus-locale'
export const SECURITY_MODE_PREFERENCE_KEY = 'nexus-security-mode'

export type AppLocale = 'ro' | 'en'
export type SecurityMode = 'custom' | 'home' | 'away' | 'night'

const APP_LOCALES: AppLocale[] = ['ro', 'en']
const SECURITY_MODES: SecurityMode[] = ['custom', 'home', 'away', 'night']

function getBooleanPreference(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  const storedValue = window.localStorage.getItem(key)
  if (storedValue === null) {
    return defaultValue
  }

  return storedValue !== 'false'
}

function setBooleanPreference(key: string, value: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, String(value))
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: { key, value } }))
}

function getStringPreference(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  return window.localStorage.getItem(key) ?? defaultValue
}

function setStringPreference(key: string, value: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, value)
  window.dispatchEvent(new CustomEvent(PREFERENCE_EVENT, { detail: { key, value } }))
}

export function subscribeToPreferenceChanges(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null) {
      return
    }

    callback()
  }

  const handleCustomChange = () => callback()

  window.addEventListener('storage', handleStorage)
  window.addEventListener(PREFERENCE_EVENT, handleCustomChange)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(PREFERENCE_EVENT, handleCustomChange)
  }
}

export function getNotificationsEnabled(): boolean {
  return getBooleanPreference(NOTIFICATIONS_PREFERENCE_KEY, true)
}

export function setNotificationsEnabled(enabled: boolean) {
  setBooleanPreference(NOTIFICATIONS_PREFERENCE_KEY, enabled)
}

export function getAutoLockEnabled(): boolean {
  return getBooleanPreference(AUTO_LOCK_PREFERENCE_KEY, true)
}

export function setAutoLockEnabled(enabled: boolean) {
  setBooleanPreference(AUTO_LOCK_PREFERENCE_KEY, enabled)
}

export function getAppLocale(): AppLocale {
  const locale = getStringPreference(LOCALE_PREFERENCE_KEY, 'ro')
  return APP_LOCALES.includes(locale as AppLocale) ? (locale as AppLocale) : 'ro'
}

export function setAppLocale(locale: AppLocale) {
  setStringPreference(LOCALE_PREFERENCE_KEY, locale)
}

export function getSecurityMode(): SecurityMode {
  const mode = getStringPreference(SECURITY_MODE_PREFERENCE_KEY, 'custom')
  return SECURITY_MODES.includes(mode as SecurityMode) ? (mode as SecurityMode) : 'custom'
}

export function setSecurityMode(mode: SecurityMode) {
  setStringPreference(SECURITY_MODE_PREFERENCE_KEY, mode)
}
