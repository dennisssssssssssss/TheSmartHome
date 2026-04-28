import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { getShellContent } from '@/lib/i18n/content'

interface AppSidebarProps {
  isCollapsed: boolean
  isDesktop: boolean
  isMobileOpen: boolean
  onNavigate: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  isDesktop,
  isMobileOpen,
  onNavigate,
}) => {
  const location = useLocation()
  const { locale } = useI18n()
  const shellContent = getShellContent(locale)
  const brandAriaLabel = locale === 'ro' ? 'Mergi la pagina principală' : 'Go to home page'
  const navItems = shellContent.navItems.filter(
    (item) => item.path !== '/app/notifications' && item.path !== '/app/settings',
  )
  const shouldCollapse = isDesktop && isCollapsed

  return (
    <div
      className={`fixed left-0 top-0 z-40 h-screen bg-background border-r transition-all duration-300 ease-in-out ${
        isDesktop
          ? shouldCollapse ? 'w-14 translate-x-0' : 'w-60 translate-x-0'
          : `w-[18rem] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
      }`}
      style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}
    >
      <div className="flex h-full flex-col">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex h-16 items-center justify-center border-b px-4 transition-colors hover:bg-sidebar-accent/50"
          style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}
          aria-label={brandAriaLabel}
        >
          {!shouldCollapse && (
            <h1 className="font-display text-xl tracking-wider text-gold">
              NEXUS HOME
            </h1>
          )}
          {shouldCollapse && (
            <span className="font-display text-xl text-gold">N</span>
          )}
        </Link>

        {!shouldCollapse && (
          <div className="h-px bg-gold my-2 mx-4" style={{ opacity: 0.3 }} />
        )}

        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-body uppercase tracking-wider transition-all duration-400 ${
                  isActive
                    ? 'text-gold-light bg-sidebar-accent border-l-2 border-gold'
                    : 'text-muted-foreground hover:text-gold-light hover:bg-sidebar-accent/50'
                } ${shouldCollapse ? 'justify-center' : ''}`}
                style={{
                  fontSize: shouldCollapse ? '16px' : '13px',
                  letterSpacing: shouldCollapse ? '0' : '0.15em',
                }}
              >
                <Icon className={`shrink-0 ${shouldCollapse ? 'size-5' : 'size-4'}`} />
                {!shouldCollapse && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
