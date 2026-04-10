import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Home,
  BatteryCharging,
  GitBranch,
  Shield,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/context/I18nContext'

interface AppSidebarProps {
  isCollapsed: boolean
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isCollapsed }) => {
  const location = useLocation()
  const { username, logout } = useAuth()
  const { locale } = useI18n()

  const navItems = locale === 'ro'
    ? [
        { icon: LayoutDashboard, label: 'Panou', path: '/app/dashboard' },
        { icon: Home, label: 'Camere si dispozitive', path: '/app/rooms' },
        { icon: GitBranch, label: 'Automatizari', path: '/app/automations' },
        { icon: BatteryCharging, label: 'Energie', path: '/app/energy' },
        { icon: Shield, label: 'Securitate', path: '/app/security' },
        { icon: Bell, label: 'Notificari', path: '/app/notifications' },
        { icon: Settings, label: 'Setari', path: '/app/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
        { icon: Home, label: 'Rooms & Devices', path: '/app/rooms' },
        { icon: GitBranch, label: 'Automations', path: '/app/automations' },
        { icon: BatteryCharging, label: 'Energy', path: '/app/energy' },
        { icon: Shield, label: 'Security', path: '/app/security' },
        { icon: Bell, label: 'Notifications', path: '/app/notifications' },
        { icon: Settings, label: 'Settings', path: '/app/settings' },
      ]

  const getInitials = (name: string | null) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-background border-r transition-all duration-600 ease-in-out ${
        isCollapsed ? 'w-14' : 'w-60'
      }`}
      style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-center border-b px-4" style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}>
          {!isCollapsed && (
            <h1 className="font-display text-xl tracking-wider text-gold">
              NEXUS HOME
            </h1>
          )}
          {isCollapsed && (
            <span className="font-display text-xl text-gold">N</span>
          )}
        </div>

        {!isCollapsed && (
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
                className={`flex items-center gap-3 px-3 py-2 text-sm font-body uppercase tracking-wider transition-all duration-400 ${
                  isActive
                    ? 'text-gold-light bg-sidebar-accent border-l-2 border-gold'
                    : 'text-muted-foreground hover:text-gold-light hover:bg-sidebar-accent/50'
                } ${isCollapsed ? 'justify-center' : ''}`}
                style={{
                  fontSize: isCollapsed ? '16px' : '13px',
                  letterSpacing: isCollapsed ? '0' : '0.15em',
                }}
              >
                <Icon className={`shrink-0 ${isCollapsed ? 'size-5' : 'size-4'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4" style={{ borderColor: 'rgba(201, 168, 76, 0.1)' }}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full border text-gold bg-background"
                style={{ borderColor: 'rgba(201, 168, 76, 0.3)' }}
              >
                <span className="text-sm font-body">{getInitials(username)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-body text-foreground">{username || 'Admin'}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-gold"
                >
                  <LogOut className="mr-1 size-3" />
                  {locale === 'ro' ? 'Deconectare' : 'Sign Out'}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={logout}
              className="flex w-full items-center justify-center text-muted-foreground hover:text-gold transition-colors"
            >
              <LogOut className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
