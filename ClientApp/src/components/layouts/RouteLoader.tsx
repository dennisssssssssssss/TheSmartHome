import React from 'react'
import { useI18n } from '@/context/I18nContext'

type RouteLoaderProps = {
  fullscreen?: boolean
}

export const RouteLoader: React.FC<RouteLoaderProps> = ({ fullscreen = false }) => {
  const { locale } = useI18n()
  const message = locale === 'ro' ? 'Se incarca pagina...' : 'Loading page...'

  return (
    <div
      className={`flex items-center justify-center ${
        fullscreen ? 'min-h-screen bg-black text-white' : 'min-h-[40vh] text-foreground'
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-lg">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
        <span>{message}</span>
      </div>
    </div>
  )
}
