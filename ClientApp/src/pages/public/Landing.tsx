import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
import {
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  ShieldCheck,
  UserPlus,
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
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(initialRegisterForm)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const isRomanian = locale === 'ro'
  const copy = getLandingContent(locale)

  const openLogin = () => {
    setLoginError('')
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const openRegister = () => {
    setRegisterError('')
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
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

  if (isAuthReady && isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-gold-muted">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <a href="#top" className="font-display text-2xl tracking-wider text-gold">
            NEXUS HOME
          </a>
          <div className="flex items-center gap-4">
            <a href="#features" className="section-label hover:text-gold-light transition-colors">
              {copy.nav.features}
            </a>
            <a href="#pricing" className="section-label hover:text-gold-light transition-colors">
              {copy.nav.pricing}
            </a>
            <a href="#about" className="section-label hover:text-gold-light transition-colors">
              {copy.nav.company}
            </a>
            <a href="#support" className="section-label hover:text-gold-light transition-colors">
              {copy.nav.support}
            </a>
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
            <Button
              variant="ghost"
              onClick={openLogin}
              className="text-gold border border-gold-muted hover:bg-gold hover:text-background uppercase tracking-wider"
            >
              {copy.auth.signIn}
            </Button>
            <Button
              onClick={openRegister}
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {copy.auth.getStarted}
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center justify-center px-6 pt-16">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="mb-4">
            <span className="section-label">{copy.hero.eyebrow}</span>
          </div>
          <h1 className="hero-title mb-6">
            <span className="text-foreground">{copy.hero.lineOne}</span>
            <br />
            <span className="text-gold">{copy.hero.lineTwo}</span>
            <br />
            <span className="text-foreground">{copy.hero.lineThree}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-md font-body text-lg font-light text-muted-foreground">{copy.hero.description}</p>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={openRegister}
              size="lg"
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {copy.auth.getStarted}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsDemoOpen(true)}
              className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider"
            >
              {copy.auth.watchDemo}
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold" />
            <span className="section-label text-xs">{copy.hero.trust}</span>
            <div className="h-px w-16 bg-gold" />
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{copy.featuresSection.eyebrow}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">{copy.featuresSection.title}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {copy.featuresSection.items.map((feature, index) => (
              <Card
                key={index}
                className="luxury-card flex flex-col items-start p-6 hover:border-gold-light"
              >
                <feature.icon className="mb-4 size-8 text-gold" />
                <h3 className="card-title mb-2 text-foreground">{feature.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 py-24 px-6 bg-elevated">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{copy.howItWorks.eyebrow}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">{copy.howItWorks.title}</h2>
          </div>
          <div className="space-y-12">
            {copy.howItWorks.steps.map((step, index) => (
              <div key={index} className="flex gap-8 items-start">
                <span className="stat-number text-gold">{step.num}</span>
                <div className="flex-1 pt-2">
                  <h3 className="card-title mb-2">{step.title}</h3>
                  <p className="font-body text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{copy.pricingSection.eyebrow}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">{copy.pricingSection.title}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {copy.pricingSection.tiers.map((tier, index) => (
              <Card
                key={index}
                className={`luxury-card flex flex-col p-8 ${
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
                    <li key={itemIndex} className="flex items-start gap-2 font-body text-sm">
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

      <section id="security" className="scroll-mt-24 py-24 px-6 bg-elevated">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{copy.securitySection.eyebrow}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">{copy.securitySection.title}</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="luxury-card p-8">
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full border border-gold-muted">
                <ShieldCheck className="size-6 text-gold" />
              </div>
              <h3 className="card-title mb-3">{copy.securitySection.cardTitle}</h3>
              <p className="font-body text-sm text-muted-foreground mb-6">{copy.securitySection.cardDescription}</p>
              <div className="space-y-3">
                {copy.securitySection.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-gold" />
                    <span className="font-body text-sm text-muted-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="luxury-card p-8">
              <div className="section-label mb-3">{copy.securitySection.secondaryEyebrow}</div>
              <h3 className="card-title mb-3">{copy.securitySection.secondaryTitle}</h3>
              <p className="font-body text-sm text-muted-foreground mb-6">{copy.securitySection.secondaryDescription}</p>
              <Button onClick={openRegister} className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                {copy.securitySection.secondaryCta}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{copy.companySection.eyebrow}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">{copy.companySection.title}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {copy.companySection.cards.map((card) => (
              <Card key={card.id} id={card.id} className="luxury-card p-8 scroll-mt-24">
                <card.icon className="mb-4 size-7 text-gold" />
                <h3 className="card-title mb-3">{card.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{card.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="support" className="scroll-mt-24 py-24 px-6 bg-elevated">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{copy.supportSection.eyebrow}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">{copy.supportSection.title}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {copy.supportSection.cards.map((card) => (
              <Card key={card.id} id={card.id} className="luxury-card p-8 scroll-mt-24">
                <card.icon className="mb-4 size-7 text-gold" />
                <h3 className="card-title mb-3">{card.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{card.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="luxury-card p-10 text-center">
            <div className="section-label mb-3">{copy.ctaSection.eyebrow}</div>
            <h2 className="font-display text-4xl font-light text-foreground mb-4">{copy.ctaSection.title}</h2>
            <p className="mx-auto max-w-2xl font-body text-sm text-muted-foreground mb-8">{copy.ctaSection.description}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button onClick={openRegister} className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                <UserPlus className="size-4" />
                {copy.auth.createAccount}
              </Button>
              <Button variant="outline" onClick={openLogin} className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider">
                {copy.auth.signIn}
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-gold-muted py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8 h-px bg-gold" style={{ opacity: 0.3 }} />
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <a href="#top" className="font-display text-xl text-gold mb-4 inline-block">
                NEXUS HOME
              </a>
              <p className="font-body text-sm text-muted-foreground">{copy.footer.description}</p>
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
        <DialogContent className="bg-card border-gold-muted">
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
              <a href="#features">{copy.demo.exploreFeatures}</a>
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
        <DialogContent className="bg-card border-gold-muted">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{copy.auth.welcomeBack}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">{copy.auth.welcomeDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
        <DialogContent className="bg-card border-gold-muted">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{copy.auth.createAccountTitle}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">{copy.auth.createAccountDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 mt-4">
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
