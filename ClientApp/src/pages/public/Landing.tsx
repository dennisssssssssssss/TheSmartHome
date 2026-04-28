import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt'
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Menu,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import { getLandingContent } from '@/lib/i18n/content'

type RegisterFormState = {
  displayName: string
  username: string
  email: string
  password: string
  confirmPassword: string
}

const initialRegisterForm: RegisterFormState = {
  displayName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { login, register, isAuthenticated, isAuthReady } = useAuth()
  const { canInstall, installApp, isInstalled } = usePwaInstallPrompt()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterForm)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [isInstallLoading, setIsInstallLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const isRomanian = locale === 'ro'
  const copy = getLandingContent(locale)
  const openDashboardLabel = isRomanian ? 'Deschide aplicația' : 'Open dashboard'
  const installLabel = isRomanian ? 'Instalează aplicația' : 'Install app'
  const installedLabel = isRomanian ? 'Aplicația este deja instalată' : 'App already installed'
  const installHint = isRomanian
    ? 'Adaug-o pe ecranul principal pentru acces rapid de pe telefon sau laptop.'
    : 'Add it to the home screen for faster access from phone or laptop.'
  const mobileMenuLabel = isRomanian ? 'Deschide meniul principal' : 'Open main menu'
  const closeMenuLabel = isRomanian ? 'Închide meniul principal' : 'Close main menu'
  const livePreviewLabel = isRomanian ? 'PREVIEW LIVE' : 'LIVE PREVIEW'
  const livePreviewTitle = isRomanian
    ? 'Așa se simte produsul după autentificare'
    : 'How the product feels after sign in'
  const livePreviewDescription = isRomanian
    ? 'Ai camere, integrări, energie și automatizări într-un singur flux, fără să cauți prin meniuri greșite.'
    : 'Rooms, integrations, energy, and automations stay in one flow without sending the user through awkward menus.'
  const previewStatusLabel = isRomanian ? 'Pregătit pentru demo' : 'Ready for demos'
  const previewHighlightsLabel = isRomanian ? 'În același loc' : 'All in one place'
  const previewMetrics = isRomanian
    ? [
        { label: 'Camere organizate', value: '12+' },
        { label: 'Rutine recurente', value: '24/7' },
        { label: 'Integrări pregătite', value: 'Matter + Modbus' },
      ]
    : [
        { label: 'Organized rooms', value: '12+' },
        { label: 'Recurring routines', value: '24/7' },
        { label: 'Integrations ready', value: 'Matter + Modbus' },
      ]
  const navigationLinks = [
    { href: '#features', label: copy.nav.features },
    { href: '#pricing', label: copy.nav.pricing },
    { href: '#about', label: copy.nav.company },
    { href: '#support', label: copy.nav.support },
  ]

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileMenuOpen])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const openDashboard = () => {
    closeMobileMenu()
    navigate('/app/dashboard')
  }

  const openLogin = () => {
    closeMobileMenu()
    setLoginError('')
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const openRegister = () => {
    closeMobileMenu()
    setRegisterError('')
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  const openDemo = () => {
    closeMobileMenu()
    setIsDemoOpen(true)
  }

  const handleInstall = async () => {
    setIsInstallLoading(true)
    try {
      await installApp()
    } finally {
      setIsInstallLoading(false)
    }
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoginLoading(true)
    setLoginError('')

    try {
      await login(credentials.username, credentials.password)
      setIsLoginOpen(false)
      navigate('/app/dashboard')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : copy.auth.loginFallbackError)
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsRegisterLoading(true)
    setRegisterError('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError(copy.auth.passwordMismatch)
      setIsRegisterLoading(false)
      return
    }

    try {
      await register({
        username: registerForm.username,
        displayName: registerForm.displayName,
        email: registerForm.email,
        password: registerForm.password,
      })

      setIsRegisterOpen(false)
      setRegisterForm(initialRegisterForm)
      navigate('/app/dashboard')
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : copy.auth.registerFallbackError)
    } finally {
      setIsRegisterLoading(false)
    }
  }

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gold-muted bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="font-display text-xl tracking-[0.25em] text-gold sm:text-2xl">
            NEXUS HOME
          </a>

          <div className="hidden items-center gap-4 lg:flex">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="section-label transition-colors hover:text-gold-light"
              >
                {link.label}
              </a>
            ))}

            <div className="flex items-center rounded-full border border-gold-muted/60 p-1">
              <button
                type="button"
                onClick={() => setLocale('ro')}
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider transition-colors ${isRomanian ? 'bg-gold text-background' : 'text-gold hover:text-gold-light'}`}
              >
                RO
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider transition-colors ${!isRomanian ? 'bg-gold text-background' : 'text-gold hover:text-gold-light'}`}
              >
                EN
              </button>
            </div>

            {canInstall && (
              <Button
                variant="ghost"
                onClick={handleInstall}
                disabled={isInstallLoading}
                className="text-gold hover:bg-gold/10 hover:text-gold-light"
              >
                <Download className="size-4" />
                {isInstallLoading ? '...' : installLabel}
              </Button>
            )}

            {isAuthReady && isAuthenticated ? (
              <Button
                onClick={openDashboard}
                className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
              >
                {openDashboardLabel}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={openLogin}
                  className="border border-gold-muted text-gold hover:bg-gold hover:text-background uppercase tracking-wider"
                >
                  {copy.auth.signIn}
                </Button>
                <Button
                  onClick={openRegister}
                  className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                >
                  {copy.auth.getStarted}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex items-center rounded-full border border-gold-muted/60 p-1">
              <button
                type="button"
                onClick={() => setLocale('ro')}
                className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${isRomanian ? 'bg-gold text-background' : 'text-gold hover:text-gold-light'}`}
              >
                RO
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${!isRomanian ? 'bg-gold text-background' : 'text-gold hover:text-gold-light'}`}
              >
                EN
              </button>
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="border border-gold-muted text-gold hover:bg-gold/10 hover:text-gold-light"
              aria-label={isMobileMenuOpen ? closeMenuLabel : mobileMenuLabel}
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-gold-muted bg-background/95 px-4 py-4 shadow-2xl lg:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-3">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="rounded-xl border border-gold-muted/40 bg-elevated/50 px-4 py-3 font-body text-sm text-foreground transition-colors hover:border-gold-light hover:text-gold-light"
                >
                  {link.label}
                </a>
              ))}

              {canInstall && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleInstall}
                  disabled={isInstallLoading}
                  className="w-full border-gold text-gold hover:bg-gold hover:text-background"
                >
                  <Download className="size-4" />
                  {isInstallLoading ? '...' : installLabel}
                </Button>
              )}

              {isAuthReady && isAuthenticated ? (
                <Button
                  onClick={openDashboard}
                  className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                >
                  {openDashboardLabel}
                </Button>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="ghost"
                    onClick={openLogin}
                    className="w-full border border-gold-muted text-gold hover:bg-gold hover:text-background uppercase tracking-wider"
                  >
                    {copy.auth.signIn}
                  </Button>
                  <Button
                    onClick={openRegister}
                    className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
                  >
                    {copy.auth.getStarted}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden border-b border-gold-muted/40">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_60%)]" />
        <div className="container relative mx-auto grid min-h-screen max-w-6xl gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-muted/60 bg-elevated/60 px-3 py-2">
              <Sparkles className="size-4 text-gold" />
              <span className="section-label">{copy.hero.eyebrow}</span>
            </div>

            <div className="space-y-5">
              <h1 className="hero-title max-w-4xl">
                <span className="text-foreground">{copy.hero.lineOne}</span>
                <br />
                <span className="text-gold">{copy.hero.lineTwo}</span>
                <br />
                <span className="text-foreground">{copy.hero.lineThree}</span>
              </h1>
              <p className="max-w-2xl font-body text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.hero.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                onClick={isAuthReady && isAuthenticated ? openDashboard : openRegister}
                size="lg"
                className="w-full bg-gold text-background hover:bg-gold-light sm:w-auto"
              >
                {isAuthReady && isAuthenticated ? openDashboardLabel : copy.auth.getStarted}
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={openDemo}
                className="w-full border-gold text-gold hover:bg-gold hover:text-background sm:w-auto"
              >
                {copy.auth.watchDemo}
              </Button>
              {(canInstall || isInstalled) && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={canInstall ? handleInstall : undefined}
                  disabled={!canInstall || isInstallLoading}
                  className="w-full border border-gold-muted/60 text-gold hover:bg-gold/10 hover:text-gold-light sm:w-auto"
                >
                  <Download className="size-4" />
                  {canInstall ? installLabel : installedLabel}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gold/35" />
              <span className="section-label text-xs">{copy.hero.trust}</span>
              <div className="h-px flex-1 bg-gold/35" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {copy.hero.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-2xl border border-gold-muted/60 bg-elevated/70 px-4 py-4 text-sm font-body text-muted-foreground"
                >
                  {highlight}
                </div>
              ))}
            </div>

            {(canInstall || isInstalled) && (
              <Card className="luxury-card border-gold-muted/60 bg-elevated/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="section-label">{isInstalled ? installedLabel : installLabel}</p>
                    <p className="font-body text-sm text-muted-foreground">{installHint}</p>
                  </div>
                  {canInstall && (
                    <Button
                      onClick={handleInstall}
                      disabled={isInstallLoading}
                      className="bg-gold text-background hover:bg-gold-light sm:w-auto"
                    >
                      <Download className="size-4" />
                      {isInstallLoading ? '...' : installLabel}
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>

          <Card className="luxury-card relative overflow-hidden border-gold/40 bg-elevated/85 p-6 sm:p-8">
            <div className="absolute inset-x-6 top-0 h-24 rounded-b-full bg-gold/10 blur-3xl" />
            <div className="relative space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="section-label">{livePreviewLabel}</p>
                  <h2 className="font-display text-3xl font-light text-foreground sm:text-4xl">
                    {livePreviewTitle}
                  </h2>
                  <p className="max-w-xl font-body text-sm leading-6 text-muted-foreground">
                    {livePreviewDescription}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-gold/40 bg-background/60 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-gold">
                  <CheckCircle2 className="size-3.5" />
                  {previewStatusLabel}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {previewMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-gold-muted/50 bg-background/60 px-4 py-4"
                  >
                    <div className="stat-number text-gold">{metric.value}</div>
                    <p className="mt-2 font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-gold-muted/50 bg-background/60 p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="section-label">{previewHighlightsLabel}</span>
                  <span className="rounded-full bg-gold/10 px-3 py-1 text-xs text-gold">
                    01
                  </span>
                </div>
                <div className="space-y-4">
                  {copy.demo.items.map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-gold-muted/70 bg-elevated text-xs text-gold">
                        {index + 1}
                      </div>
                      <p className="font-body text-sm leading-6 text-muted-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-2">
              <span className="section-label">{copy.featuresSection.eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl font-light text-foreground sm:text-5xl">
              {copy.featuresSection.title}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {copy.featuresSection.items.map((feature, index) => (
              <Card
                key={index}
                className="luxury-card flex flex-col items-start p-5 hover:border-gold-light sm:p-6"
              >
                <feature.icon className="mb-4 size-8 text-gold" />
                <h3 className="card-title mb-2 text-foreground">{feature.title}</h3>
                <p className="font-body text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-2">
              <span className="section-label">{copy.howItWorks.eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl font-light text-foreground sm:text-5xl">
              {copy.howItWorks.title}
            </h2>
          </div>
          <div className="space-y-6 sm:space-y-8">
            {copy.howItWorks.steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-3xl border border-gold-muted/45 bg-background/55 p-5 sm:flex-row sm:gap-8 sm:p-6"
              >
                <span className="stat-number text-gold">{step.num}</span>
                <div className="flex-1 pt-0.5">
                  <h3 className="card-title mb-2">{step.title}</h3>
                  <p className="font-body leading-6 text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-2">
              <span className="section-label">{copy.pricingSection.eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl font-light text-foreground sm:text-5xl">
              {copy.pricingSection.title}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:gap-8">
            {copy.pricingSection.tiers.map((tier, index) => (
              <Card
                key={index}
                className={`luxury-card flex h-full flex-col p-6 sm:p-8 ${
                  tier.popular ? 'border-gold' : ''
                }`}
              >
                {tier.popular && (
                  <div className="mb-4">
                    <span className="section-label text-xs">{copy.pricingSection.popular}</span>
                  </div>
                )}
                <h3 className="card-title mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="stat-number text-gold">{tier.price}</span>
                  <span className="font-body text-sm text-muted-foreground">{copy.pricingSection.perMonth}</span>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((feature, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 font-body text-sm leading-6">
                      <span className="text-gold">&#8226;</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={openRegister}
                  variant={tier.popular ? 'default' : 'outline'}
                  className={`w-full uppercase tracking-wider ${
                    tier.popular ? 'bg-gold text-background hover:bg-gold-light' : 'border-gold text-gold hover:bg-gold hover:text-background'
                  }`}
                >
                  {copy.auth.getStarted}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-24 bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-2">
              <span className="section-label">{copy.securitySection.eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl font-light text-foreground sm:text-5xl">
              {copy.securitySection.title}
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <Card className="luxury-card p-6 sm:p-8">
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full border border-gold-muted">
                <ShieldCheck className="size-6 text-gold" />
              </div>
              <h3 className="card-title mb-3">{copy.securitySection.cardTitle}</h3>
              <p className="mb-6 font-body text-sm leading-6 text-muted-foreground">{copy.securitySection.cardDescription}</p>
              <div className="space-y-3">
                {copy.securitySection.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-gold" />
                    <span className="font-body text-sm leading-6 text-muted-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="luxury-card flex flex-col justify-between p-6 sm:p-8">
              <div className="section-label mb-3">{copy.securitySection.secondaryEyebrow}</div>
              <h3 className="card-title mb-3">{copy.securitySection.secondaryTitle}</h3>
              <p className="mb-6 font-body text-sm leading-6 text-muted-foreground">{copy.securitySection.secondaryDescription}</p>
              <Button onClick={openRegister} className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                {copy.securitySection.secondaryCta}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-2">
              <span className="section-label">{copy.companySection.eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl font-light text-foreground sm:text-5xl">
              {copy.companySection.title}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:gap-8">
            {copy.companySection.cards.map((card) => (
              <Card key={card.id} id={card.id} className="luxury-card scroll-mt-24 p-6 sm:p-8">
                <card.icon className="mb-4 size-7 text-gold" />
                <h3 className="card-title mb-3">{card.title}</h3>
                <p className="font-body text-sm leading-6 text-muted-foreground">{card.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="support" className="scroll-mt-24 bg-elevated px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <div className="mb-2">
              <span className="section-label">{copy.supportSection.eyebrow}</span>
            </div>
            <h2 className="font-display text-4xl font-light text-foreground sm:text-5xl">
              {copy.supportSection.title}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:gap-8">
            {copy.supportSection.cards.map((card) => (
              <Card key={card.id} id={card.id} className="luxury-card scroll-mt-24 p-6 sm:p-8">
                <card.icon className="mb-4 size-7 text-gold" />
                <h3 className="card-title mb-3">{card.title}</h3>
                <p className="font-body text-sm leading-6 text-muted-foreground">{card.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="luxury-card p-6 text-center sm:p-10">
            <div className="section-label mb-3">{copy.ctaSection.eyebrow}</div>
            <h2 className="mb-4 font-display text-3xl font-light text-foreground sm:text-4xl">{copy.ctaSection.title}</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-sm leading-6 text-muted-foreground">{copy.ctaSection.description}</p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              {isAuthReady && isAuthenticated ? (
                <Button
                  onClick={openDashboard}
                  className="w-full bg-gold text-background hover:bg-gold-light sm:w-auto"
                >
                  <ArrowRight className="size-4" />
                  {openDashboardLabel}
                </Button>
              ) : (
                <>
                  <Button onClick={openRegister} className="w-full bg-gold text-background hover:bg-gold-light sm:w-auto">
                    <UserPlus className="size-4" />
                    {copy.auth.createAccount}
                  </Button>
                  <Button variant="outline" onClick={openLogin} className="w-full border-gold text-gold hover:bg-gold hover:text-background sm:w-auto">
                    {copy.auth.signIn}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gold-muted px-4 py-12 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 h-px bg-gold/30" />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <a href="#top" className="mb-4 inline-block font-display text-xl text-gold">
                NEXUS HOME
              </a>
              <p className="font-body text-sm leading-6 text-muted-foreground">{copy.footer.description}</p>
            </div>
            <div>
              <h4 className="section-label mb-4">{copy.footer.product}</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-gold transition-colors">{copy.footer.features}</a></li>
                <li><a href="#pricing" className="hover:text-gold transition-colors">{copy.footer.pricing}</a></li>
                <li><a href="#security" className="hover:text-gold transition-colors">{copy.footer.security}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="section-label mb-4">{copy.footer.company}</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-gold transition-colors">{copy.footer.about}</a></li>
                <li><a href="#blog" className="hover:text-gold transition-colors">{copy.footer.blog}</a></li>
                <li><a href="#careers" className="hover:text-gold transition-colors">{copy.footer.careers}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="section-label mb-4">{copy.footer.support}</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li><a href="#support" className="hover:text-gold transition-colors">{copy.footer.helpCenter}</a></li>
                <li><a href="#contact" className="hover:text-gold transition-colors">{copy.footer.contact}</a></li>
                <li><a href="#privacy" className="hover:text-gold transition-colors">{copy.footer.privacy}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center font-body text-sm text-muted-foreground">
            <p>&copy; 2026 NEXUS HOME. {copy.footer.rights}</p>
          </div>
        </div>
      </footer>

      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-gold-muted bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{copy.demo.title}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">{copy.demo.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {copy.demo.items.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-gold-muted/50 bg-background/60 p-4">
                <PlayCircle className="mt-0.5 size-4 text-gold" />
                <span className="font-body text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider">
              <a href="#features" onClick={() => setIsDemoOpen(false)}>{copy.demo.exploreFeatures}</a>
            </Button>
            <Button
              onClick={() => {
                setIsDemoOpen(false)
                openRegister()
              }}
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {copy.auth.createAccount}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-gold-muted bg-card">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{copy.auth.welcomeBack}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">{copy.auth.welcomeDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.username}</label>
              <Input
                value={credentials.username}
                onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
                placeholder="admin"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.password}</label>
              <Input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
                placeholder="assist2026"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}
            <Button
              type="submit"
              disabled={isLoginLoading}
              className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {isLoginLoading ? copy.auth.signingIn : copy.auth.signIn}
            </Button>
            <div className="space-y-2 text-center">
              <p className="text-xs text-muted-foreground font-body">
                {copy.auth.defaultAdminHint}
              </p>
              <button
                type="button"
                onClick={openRegister}
                className="text-xs uppercase tracking-wider text-gold hover:text-gold-light"
              >
                {copy.auth.needAccount}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-gold-muted bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{copy.auth.createAccountTitle}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">{copy.auth.createAccountDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="mt-4 space-y-4">
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.displayName}</label>
              <Input
                value={registerForm.displayName}
                onChange={(event) => setRegisterForm({ ...registerForm, displayName: event.target.value })}
                placeholder="Alex Morgan"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.username}</label>
              <Input
                value={registerForm.username}
                onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                placeholder="alex"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.email}</label>
              <Input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                placeholder="alex@example.com"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.password}</label>
              <Input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                placeholder={copy.auth.minimumCharacters}
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{copy.auth.confirmPassword}</label>
              <Input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })}
                placeholder={copy.auth.repeatPassword}
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            {registerError && (
              <p className="text-sm text-destructive">{registerError}</p>
            )}
            <Button
              type="submit"
              disabled={isRegisterLoading}
              className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {isRegisterLoading ? copy.auth.creatingAccount : copy.auth.createAccount}
            </Button>
            <div className="space-y-2 text-center">
              <p className="text-xs text-muted-foreground font-body">{copy.auth.accountStoredHint}</p>
              <button
                type="button"
                onClick={openLogin}
                className="text-xs uppercase tracking-wider text-gold hover:text-gold-light"
              >
                {copy.auth.alreadyHaveAccount}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
