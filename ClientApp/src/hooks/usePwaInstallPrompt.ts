import { useCallback, useEffect, useState } from 'react'

type InstallOutcome = 'accepted' | 'dismissed'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: InstallOutcome
    platform: string
  }>
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  )
}

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode())

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      return false
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    const accepted = outcome === 'accepted'

    setDeferredPrompt(null)
    if (accepted) {
      setIsInstalled(true)
    }

    return accepted
  }, [deferredPrompt])

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    installApp,
    isInstalled,
  }
}
