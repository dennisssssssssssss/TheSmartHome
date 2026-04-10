import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useI18n()
  const { username, logout } = useAuth()
  const navigate = useNavigate()

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

  const handleNotificationsChange = (v: boolean) => {
    setNotificationsEnabledState(v)
    setNotificationsEnabled(v)
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
        toast.error(locale === 'ro'
          ? 'Adauga cel putin o incuietoare inteligenta inainte sa activezi auto-lock'
          : 'Add at least one smart lock before enabling auto-lock')
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

        toast.success(locale === 'ro'
          ? 'Auto-lock a fost activat pentru toate incuietorile la 22:00'
          : 'Auto-lock was enabled for all locks at 22:00')
      } else {
        await Promise.all(
          autoLockRules.map((rule) => api.automations.update(rule.id, { ...rule, enabled: false })),
        )

        toast.success(locale === 'ro' ? 'Auto-lock a fost dezactivat' : 'Auto-lock was disabled')
      }

      setAutoLockEnabledState(enabled)
      setAutoLockEnabled(enabled)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (locale === 'ro' ? 'Nu am putut actualiza auto-lock' : 'Could not update auto-lock'))
      setAutoLockEnabledState(getAutoLockEnabled())
    } finally {
      setIsUpdatingAutoLock(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(locale === 'ro' ? 'Completeaza toate campurile pentru parola' : 'Complete all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(locale === 'ro' ? 'Parolele nu coincid' : 'Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error(locale === 'ro' ? 'Parola noua trebuie sa aiba cel putin 8 caractere' : 'New password must contain at least 8 characters')
      return
    }

    setIsChangingPassword(true)

    try {
      await api.auth.changePassword(currentPassword, newPassword)
      toast.success(locale === 'ro' ? 'Parola a fost schimbata cu succes' : 'Password changed successfully')
      setPasswordDialogOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (locale === 'ro' ? 'Nu am putut schimba parola' : 'Could not change the password'))
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleFactoryReset = () => {
    if (!confirm(locale === 'ro'
      ? 'Esti sigur? Vei fi deconectat, iar datele locale salvate in acest browser vor fi sterse.'
      : 'Are you sure? You will be signed out and the browser-stored local data will be cleared.')) return
    localStorage.clear()
    logout()
    setTheme('system')
    navigate('/')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="section-label mb-2">SETTINGS</div>
        <h1 className="page-title">{locale === 'ro' ? 'Preferintele tale.' : 'Your preferences.'}</h1>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card className="luxury-card p-6">
          <h3 className="font-display text-xl mb-4">{locale === 'ro' ? 'General' : 'General'}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">{locale === 'ro' ? 'Tema inchisa' : 'Dark mode'}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {locale === 'ro' ? 'Comuta intre tema inchisa si tema deschisa' : 'Switch between dark and light theme'}
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                className="data-[state=checked]:bg-gold"
              />
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between gap-6">
              <div>
                <Label className="text-foreground">{locale === 'ro' ? 'Limba interfetei' : 'Interface language'}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {locale === 'ro' ? 'Alege limba pentru site si aplicatie' : 'Choose the language for the site and app'}
                </p>
              </div>
              <div className="w-48">
                <Select value={locale} onValueChange={(value) => setLocale(value as 'ro' | 'en')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ro">Romana</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">{locale === 'ro' ? 'Notificari' : 'Notifications'}</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {locale === 'ro' ? 'Preferinta locala pentru acest browser' : 'Local preference for this browser'}
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
                <Label className="text-foreground">Auto-Lock</Label>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  {locale === 'ro'
                    ? 'Creeaza o automatizare zilnica la 22:00 pentru fiecare incuietoare'
                    : 'Creates a daily 22:00 automation for every lock'}
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
          <h3 className="font-display text-xl mb-4">{locale === 'ro' ? 'Cont' : 'Account'}</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">{locale === 'ro' ? 'Utilizator' : 'Username'}</Label>
              <p className="font-body text-sm text-muted-foreground mt-1">{username || 'admin'}</p>
            </div>
            <Separator className="bg-border" />
            <div>
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(true)}
                className="border-gold text-gold hover:bg-gold hover:text-background"
              >
                {locale === 'ro' ? 'Schimba parola' : 'Change password'}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="luxury-card p-6">
          <h3 className="font-display text-xl mb-4">{locale === 'ro' ? 'Sistem' : 'System'}</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">{locale === 'ro' ? 'Versiune' : 'Version'}</Label>
              <p className="font-body text-sm text-muted-foreground mt-1">NEXUS HOME 2026.1.0</p>
            </div>
            <Separator className="bg-border" />
            <div>
              <p className="font-body text-sm text-muted-foreground mb-3">
                {locale === 'ro'
                  ? 'Aceasta actiune sterge doar preferintele salvate in browser si te deconecteaza. Nu sterge dispozitivele sau datele din baza de date.'
                  : 'This action only clears browser-stored preferences and signs you out. It does not delete devices or database data.'}
              </p>
              <Button variant="destructive" onClick={handleFactoryReset} className="bg-destructive text-destructive-foreground">
                {locale === 'ro' ? 'Reseteaza datele locale' : 'Reset local data'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === 'ro' ? 'Schimba parola' : 'Change password'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-pw">{locale === 'ro' ? 'Parola actuala' : 'Current password'}</Label>
              <Input id="current-pw" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-pw">{locale === 'ro' ? 'Parola noua' : 'New password'}</Label>
              <Input id="new-pw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-pw">{locale === 'ro' ? 'Confirma parola' : 'Confirm password'}</Label>
              <Input id="confirm-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>{locale === 'ro' ? 'Anuleaza' : 'Cancel'}</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword} className="bg-gold text-background hover:bg-gold-light">
              {isChangingPassword
                ? (locale === 'ro' ? 'Se salveaza...' : 'Saving...')
                : (locale === 'ro' ? 'Salveaza' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
