import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useTheme } from '@/context/ThemeContext'
import { api } from '@/lib/api'
import { getAutoLockEnabled, getNotificationsEnabled, setAutoLockEnabled, setNotificationsEnabled } from '@/lib/preferences'
import { AUTO_LOCK_INTERVAL_MINUTES, getAutoLockRuleName, getNextAutoLockRunValue, isAutoLockRule } from '@/lib/security'
import { toast } from 'sonner'
import { getSettingsContent } from '@/lib/i18n/settings'

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useI18n()
  const copy = getSettingsContent(locale)
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [notificationsEnabled, setNotificationsEnabledState] = useState(getNotificationsEnabled)
  const [autoLockEnabled, setAutoLockEnabledState] = useState(getAutoLockEnabled)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingAutoLock, setIsUpdatingAutoLock] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadAutoLockState = async () => {
      try {
        const [devices, automations] = await Promise.all([
          api.devices.getAll(),
          api.automations.getAll(),
        ])

        const lockIds = new Set(devices.filter((device) => device.type === 'lock').map((device) => device.id))
        const serverEnabled = automations.some((automation) =>
          isAutoLockRule(automation) &&
          automation.enabled &&
          !!automation.device_id &&
          lockIds.has(automation.device_id),
        )

        if (!isMounted) {
          return
        }

        setAutoLockEnabledState(serverEnabled)
        setAutoLockEnabled(serverEnabled)
      } catch {
        if (!isMounted) {
          return
        }

        setAutoLockEnabledState(getAutoLockEnabled())
      }
    }

    loadAutoLockState()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (searchParams.get('changePassword') === '1') {
      setPasswordDialogOpen(true)
    }
  }, [searchParams])

  const handleNotificationsChange = (value: boolean) => {
    setNotificationsEnabledState(value)
    setNotificationsEnabled(value)
  }

  const handleAutoLockChange = async (enabled: boolean) => {
    setIsUpdatingAutoLock(true)

    try {
      const [devices, automations] = await Promise.all([
        api.devices.getAll(),
        api.automations.getAll(),
      ])

      const lockDevices = devices.filter((device) => device.type === 'lock')
      const autoLockRules = automations.filter(isAutoLockRule)

      if (enabled && lockDevices.length === 0) {
        toast.error(copy.notifications.autoLockNeedsDevice)
        setAutoLockEnabledState(false)
        setAutoLockEnabled(false)
        return
      }

      if (enabled) {
        const nextRunUtc = getNextAutoLockRunValue()
        const activeLockIds = new Set(lockDevices.map((device) => device.id))

        await Promise.all([
          ...lockDevices.map(async (device) => {
            const existingRule = autoLockRules.find((rule) => rule.device_id === device.id)
            const payload = {
              name: getAutoLockRuleName(device),
              device_id: device.id,
              action_type: 'TurnOn',
              trigger_value: nextRunUtc,
              interval_minutes: AUTO_LOCK_INTERVAL_MINUTES,
              enabled: true,
            }

            if (existingRule) {
              await api.automations.update(existingRule.id, { ...existingRule, ...payload })
              return
            }

            await api.automations.create(payload)
          }),
          ...autoLockRules
            .filter((rule) => !rule.device_id || !activeLockIds.has(rule.device_id))
            .map((rule) => api.automations.update(rule.id, { ...rule, enabled: false })),
        ])

        toast.success(copy.notifications.autoLockEnabled)
      } else {
        await Promise.all(
          autoLockRules.map((rule) => api.automations.update(rule.id, { ...rule, enabled: false })),
        )

        toast.success(copy.notifications.autoLockDisabled)
      }

      setAutoLockEnabledState(enabled)
      setAutoLockEnabled(enabled)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.notifications.autoLockUpdateFailed)
      setAutoLockEnabledState(getAutoLockEnabled())
    } finally {
      setIsUpdatingAutoLock(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(copy.notifications.completePasswordFields)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(copy.notifications.passwordMismatch)
      return
    }

    if (newPassword.length < 8) {
      toast.error(copy.notifications.passwordTooShort)
      return
    }

    setIsChangingPassword(true)

    try {
      await api.auth.changePassword(currentPassword, newPassword)
      toast.success(copy.notifications.passwordChanged)
      setPasswordDialogOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.notifications.passwordChangeFailed)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleFactoryReset = () => {
    if (!confirm(copy.system.resetConfirmation)) {
      return
    }

    localStorage.clear()
    logout()
    setTheme('system')
    navigate('/')
  }

  const handlePasswordDialogOpenChange = (open: boolean) => {
    setPasswordDialogOpen(open)

    if (!open && searchParams.get('changePassword') === '1') {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('changePassword')
      setSearchParams(nextSearchParams, { replace: true })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="section-label mb-2">{copy.page.eyebrow}</div>
        <h1 className="page-title">{copy.page.title}</h1>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card className="luxury-card p-6">
          <h3 className="font-display text-xl mb-4">{copy.sections.general}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">{copy.general.theme}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {copy.general.themeDescription}
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(value) => setTheme(value ? 'dark' : 'light')}
                className="data-[state=checked]:bg-gold"
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between gap-6">
              <div>
                <Label className="text-foreground">{copy.general.language}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {copy.general.languageDescription}
                </p>
              </div>
              <div className="w-48">
                <Select value={locale} onValueChange={(value) => setLocale(value as 'ro' | 'en')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ro">{copy.general.romanian}</SelectItem>
                    <SelectItem value="en">{copy.general.english}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">{copy.general.notifications}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {copy.general.notificationsDescription}
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsChange}
                className="data-[state=checked]:bg-gold"
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">{copy.general.autoLock}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {copy.general.autoLockDescription}
                </p>
              </div>
              <Switch
                checked={autoLockEnabled}
                onCheckedChange={handleAutoLockChange}
                disabled={isUpdatingAutoLock}
                className="data-[state=checked]:bg-gold"
              />
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <h3 className="font-display text-xl mb-4">{copy.sections.account}</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">{copy.account.username}</Label>
              <p className="font-body text-sm text-muted-foreground mt-1">{username || 'admin'}</p>
            </div>
            <Separator className="bg-border" />
            <div>
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(true)}
                className="border-gold text-gold hover:bg-gold hover:text-background"
              >
                {copy.account.changePassword}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <h3 className="font-display text-xl mb-4">{copy.sections.system}</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">{copy.system.version}</Label>
              <p className="font-body text-sm text-muted-foreground mt-1">NEXUS HOME 2026.1.0</p>
            </div>
            <Separator className="bg-border" />
            <div>
              <p className="font-body text-sm text-muted-foreground mb-3">
                {copy.system.resetDescription}
              </p>
              <Button variant="destructive" onClick={handleFactoryReset} className="bg-destructive text-destructive-foreground">
                {copy.system.resetLocalData}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy.passwordDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-pw">{copy.account.currentPassword}</Label>
              <Input id="current-pw" type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-pw">{copy.account.newPassword}</Label>
              <Input id="new-pw" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-pw">{copy.account.confirmPassword}</Label>
              <Input id="confirm-pw" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>{copy.passwordDialog.cancel}</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword} className="bg-gold text-background hover:bg-gold-light">
              {isChangingPassword ? copy.passwordDialog.saving : copy.passwordDialog.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
