import React, { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'
import { useI18n } from '@/context/I18nContext'

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isAuthReady } = useAuth()
  const { locale } = useI18n()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="section-label text-gold">{locale === 'ro' ? 'Se incarca...' : 'Loading...'}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isCollapsed={isSidebarCollapsed} />
      <TopBar
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main
        className={`pt-16 transition-all duration-600 ${
          isSidebarCollapsed ? 'ml-14' : 'ml-60'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
