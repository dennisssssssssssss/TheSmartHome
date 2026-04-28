import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getAppLocale, setAppLocale, subscribeToPreferenceChanges, type AppLocale } from '@/lib/preferences'

type I18nContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  formatDate: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string
  formatDateTime: (value: string | number | Date, options?: Intl.DateTimeFormatOptions) => string
  formatRelativeTime: (value: string | number | Date) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const LOCALE_TAGS: Record<AppLocale, string> = {
  ro: 'ro-RO',
  en: 'en-US',
}

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocaleState] = useState<AppLocale>(getAppLocale)

  useEffect(() => {
    const unsubscribe = subscribeToPreferenceChanges(() => {
      setLocaleState(getAppLocale())
    })

    return unsubscribe
  }, [])

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setAppLocale(nextLocale)
    setLocaleState(nextLocale)
  }, [])

  const localeTag = LOCALE_TAGS[locale]

  const formatDate = useCallback((value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
    return new Date(value).toLocaleDateString(localeTag, options)
  }, [localeTag])

  const formatDateTime = useCallback((value: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
    return new Date(value).toLocaleString(localeTag, options)
  }, [localeTag])

  const formatRelativeTime = useCallback((value: string | number | Date) => {
    const date = new Date(value)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.max(Math.floor(diff / 60000), 0)
    const hours = Math.floor(minutes / 60)

    if (minutes <= 0) {
      return locale === 'ro' ? 'chiar acum' : 'just now'
    }

    if (minutes < 60) {
      if (locale === 'ro') {
        return minutes === 1 ? 'acum 1 minut' : `acum ${minutes} minute`
      }

      return minutes === 1 ? '1 min ago' : `${minutes} min ago`
    }

    if (hours < 24) {
      if (locale === 'ro') {
        return hours === 1 ? 'acum 1 oră' : `acum ${hours} ore`
      }

      return hours === 1 ? '1 h ago' : `${hours} h ago`
    }

    return formatDate(date)
  }, [formatDate, locale])

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    formatDate,
    formatDateTime,
    formatRelativeTime,
  }), [formatDate, formatDateTime, formatRelativeTime, locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }

  return context
}
