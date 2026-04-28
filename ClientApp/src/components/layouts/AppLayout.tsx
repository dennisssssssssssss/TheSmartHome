import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'
import { useI18n } from '@/context/I18nContext'
import { getShellContent } from '@/lib/i18n/content'

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isAuthReady } = useAuth()
  const { locale } = useI18n()
  const shellContent = getShellContent(locale)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  })
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in event ? event.matches : mediaQuery.matches
      setIsDesktop(matches)

      if (matches) {
        setIsMobileSidebarOpen(false)
      }
    }

    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const handleToggleSidebar = () => {
    if (isDesktop) {
      setIsSidebarCollapsed((current) => !current)
      return
    }

    setIsMobileSidebarOpen((current) => !current)
  }

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="section-label text-gold">{shellContent.loading}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      {!isDesktop && isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
        />
      )}

      <AppSidebar
        isCollapsed={isDesktop ? isSidebarCollapsed : false}
        isDesktop={isDesktop}
        isMobileOpen={isMobileSidebarOpen}
        onNavigate={() => setIsMobileSidebarOpen(false)}
      />
      <TopBar
        isCollapsed={isDesktop ? isSidebarCollapsed : false}
        isDesktop={isDesktop}
        onToggleSidebar={handleToggleSidebar}
      />
      <main
        className={`pt-16 transition-all duration-600 ${
          isDesktop ? (isSidebarCollapsed ? 'lg:ml-14' : 'lg:ml-60') : 'ml-0'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
