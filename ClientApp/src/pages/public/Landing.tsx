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
  Briefcase,
  CheckCircle2,
  Home,
  LifeBuoy,
  Lock,
  Mail,
  Newspaper,
  PlayCircle,
  ScrollText,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  UserPlus,
  Zap,
} from 'lucide-react'

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
      setLoginError(error instanceof Error ? error.message : (isRomanian ? 'Nu te poti autentifica acum.' : 'Unable to sign in right now.'))
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsRegisterLoading(true)
    setRegisterError('')

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError(isRomanian ? 'Parolele nu coincid.' : 'Passwords do not match.')
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
      setRegisterError(error instanceof Error ? error.message : (isRomanian ? 'Nu iti poti crea contul acum.' : 'Unable to create your account right now.'))
    } finally {
      setIsRegisterLoading(false)
    }
  }

  const features = isRomanian ? [
    {
      icon: Home,
      title: 'Control unificat',
      description: 'Administrezi toate dispozitivele dintr-o singura interfata eleganta.',
    },
    {
      icon: Zap,
      title: 'Automatizari inteligente',
      description: 'Creezi rutine care se adapteaza la stilul tau de viata.',
    },
    {
      icon: TrendingUp,
      title: 'Vizibilitate energie',
      description: 'Monitorizezi consumul si reduci costurile energetice.',
    },
    {
      icon: Shield,
      title: 'Securitate enterprise',
      description: 'Criptarea si autentificarea moderna iti protejeaza datele.',
    },
    {
      icon: Smartphone,
      title: 'Acces de oriunde',
      description: 'Iti accesezi locuinta de pe orice dispozitiv, oriunde te afli.',
    },
    {
      icon: Lock,
      title: 'Confidentialitate reala',
      description: 'Datele tale raman ale tale. Intotdeauna.',
    },
  ] : [
    {
      icon: Home,
      title: 'Unified control',
      description: 'Manage every device from a single, elegant interface.',
    },
    {
      icon: Zap,
      title: 'Smart automations',
      description: 'Create routines that adapt to your daily rhythm.',
    },
    {
      icon: TrendingUp,
      title: 'Energy visibility',
      description: 'Track consumption and reduce operational costs.',
    },
    {
      icon: Shield,
      title: 'Enterprise security',
      description: 'Modern encryption and authentication protect your data.',
    },
    {
      icon: Smartphone,
      title: 'Access anywhere',
      description: 'Reach the home from any device, wherever you are.',
    },
    {
      icon: Lock,
      title: 'Real privacy',
      description: 'Your data stays yours. Always.',
    },
  ]

  const pricingTiers = isRomanian ? [
    {
      name: 'Start',
      price: '$19',
      features: ['Pana la 10 dispozitive', 'Automatizari de baza', 'Acces din aplicatie', 'Suport pe email'],
    },
    {
      name: 'Pro',
      price: '$49',
      popular: true,
      features: ['Dispozitive nelimitate', 'Automatizari avansate', 'Suport prioritar', 'Analize de consum', 'Control vocal'],
    },
    {
      name: 'Enterprise',
      price: '$99',
      features: ['Tot ce este in Pro', 'Integrari personalizate', 'Suport dedicat', 'Garantie SLA', 'Optiune white-label'],
    },
  ] : [
    {
      name: 'Starter',
      price: '$19',
      features: ['Up to 10 devices', 'Basic automations', 'App access', 'Email support'],
    },
    {
      name: 'Pro',
      price: '$49',
      popular: true,
      features: ['Unlimited devices', 'Advanced automations', 'Priority support', 'Energy analytics', 'Voice control'],
    },
    {
      name: 'Enterprise',
      price: '$99',
      features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'White-label option'],
    },
  ]

  const securityHighlights = isRomanian ? [
    'Acces JWT pentru fiecare apel protejat catre API',
    'Stocare securizata a parolelor cu PBKDF2 si salt unic',
    'Actualizari live pentru dispozitive si notificari prin SignalR',
  ] : [
    'JWT access for every protected API call',
    'Secure password storage with PBKDF2 hashing and unique salts',
    'Live device and notification updates through SignalR',
  ]

  const companyCards = isRomanian ? [
    {
      id: 'about',
      icon: ShieldCheck,
      title: 'Despre',
      description: 'NEXUS HOME aduce design premium, orchestrare hardware si fluxuri sigure intr-o singura platforma de control.',
    },
    {
      id: 'blog',
      icon: Newspaper,
      title: 'Blog',
      description: 'Note de produs, actualizari si idei de automatizare pentru o locuinta care functioneaza firesc.',
    },
    {
      id: 'careers',
      icon: Briefcase,
      title: 'Cariere',
      description: 'Construim echipe in product design, sisteme embedded si operatiuni asistate de AI.',
    },
  ] : [
    {
      id: 'about',
      icon: ShieldCheck,
      title: 'About',
      description: 'NEXUS HOME brings premium design, hardware orchestration, and secure workflows into one control surface.',
    },
    {
      id: 'blog',
      icon: Newspaper,
      title: 'Blog',
      description: 'Product notes, updates, and automation ideas for homes that should feel effortless.',
    },
    {
      id: 'careers',
      icon: Briefcase,
      title: 'Careers',
      description: 'We are building teams across product design, embedded systems, and AI-assisted operations.',
    },
  ]

  const supportCards = isRomanian ? [
    {
      id: 'support',
      icon: LifeBuoy,
      title: 'Centru de ajutor',
      description: 'Aici gasesti ghiduri de configurare, pairing pentru dispozitive si rezolvare pentru automatizari.',
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Contact',
      description: 'Contacteaza echipa de suport la support@nexushome.local pentru onboarding sau urgente.',
    },
    {
      id: 'privacy',
      icon: ScrollText,
      title: 'Confidentialitate',
      description: 'Colectam doar datele necesare pentru securizarea contului si automatizarea rutinei tale.',
    },
  ] : [
    {
      id: 'support',
      icon: LifeBuoy,
      title: 'Help Center',
      description: 'Setup guides, pairing steps, and automation troubleshooting live here.',
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Contact',
      description: 'Reach the support team at support@nexushome.local for onboarding or urgent issues.',
    },
    {
      id: 'privacy',
      icon: ScrollText,
      title: 'Privacy',
      description: 'We collect only the data required to secure the account and automate your routines.',
    },
  ]

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
              {isRomanian ? 'Functionalitati' : 'Features'}
            </a>
            <a href="#pricing" className="section-label hover:text-gold-light transition-colors">
              {isRomanian ? 'Preturi' : 'Pricing'}
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
              {isRomanian ? 'Autentificare' : 'Sign in'}
            </Button>
            <Button
              onClick={openRegister}
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {isRomanian ? 'Incepe acum' : 'Get started'}
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center justify-center px-6 pt-16">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="mb-4">
            <span className="section-label">{isRomanian ? 'PLATFORMA SMART HOME' : 'SMART HOME PLATFORM'}</span>
          </div>
          <h1 className="hero-title mb-6">
            <span className="text-foreground">{isRomanian ? 'Casa ta.' : 'Your home.'}</span>
            <br />
            <span className="text-gold">{isRomanian ? 'Inteligenta.' : 'Intelligent.'}</span>
            <br />
            <span className="text-foreground">{isRomanian ? 'Fara efort.' : 'Effortless.'}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-md font-body text-lg font-light text-muted-foreground">
            {isRomanian
              ? 'Descopera automatizarea premium, cu control clar si o experienta rafinata.'
              : 'Discover premium automation with clear control and a refined experience.'}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={openRegister}
              size="lg"
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {isRomanian ? 'Incepe acum' : 'Get started'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsDemoOpen(true)}
              className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider"
            >
              {isRomanian ? 'Vezi demo' : 'Watch demo'}
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold" />
            <span className="section-label text-xs">
              {isRomanian ? 'Ales deja de peste 12.000 de locuinte din intreaga lume' : 'Already trusted by over 12,000 homes worldwide'}
            </span>
            <div className="h-px w-16 bg-gold" />
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{isRomanian ? 'FUNCTIONALITATI' : 'FEATURES'}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">
              {isRomanian ? 'Tot ce ai nevoie.' : 'Everything you need.'}
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
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
              <span className="section-label">{isRomanian ? 'CUM FUNCTIONEAZA' : 'HOW IT WORKS'}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">
              {isRomanian ? 'Simplu prin design.' : 'Simple by design.'}
            </h2>
          </div>
          <div className="space-y-12">
            {(isRomanian
              ? [
                  { num: '01', title: 'Conectezi dispozitivele', desc: 'Adaugi rapid dispozitivele smart cu un flux clar de configurare.' },
                  { num: '02', title: 'Definesti rutinele', desc: 'Creezi automatizari care urmeaza ritmul tau zilnic.' },
                  { num: '03', title: 'Te bucuri de rezultat', desc: 'Casa reactioneaza mai rapid, mai elegant si mai coerent.' },
                ]
              : [
                  { num: '01', title: 'Connect your devices', desc: 'Add smart devices quickly through a guided setup flow.' },
                  { num: '02', title: 'Define your routines', desc: 'Create automations that follow your daily rhythm.' },
                  { num: '03', title: 'Enjoy the result', desc: 'Your home reacts faster, more elegantly, and more coherently.' },
                ]).map((step, index) => (
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
              <span className="section-label">{isRomanian ? 'PRETURI' : 'PRICING'}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">
              {isRomanian ? 'Alege planul potrivit.' : 'Choose the right plan.'}
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier, index) => (
              <Card
                key={index}
                className={`luxury-card flex flex-col p-8 ${
                  tier.popular ? 'border-gold' : ''
                }`}
              >
                {tier.popular && (
                  <div className="mb-4">
                    <span className="section-label text-xs">{isRomanian ? 'CEL MAI ALES' : 'MOST POPULAR'}</span>
                  </div>
                )}
                <h3 className="card-title mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="stat-number text-gold">{tier.price}</span>
                  <span className="font-body text-sm text-muted-foreground">{isRomanian ? '/luna' : '/month'}</span>
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
                  {isRomanian ? 'Incepe acum' : 'Get started'}
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
              <span className="section-label">SECURITY</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">
              {isRomanian ? 'Securitate gandita intentionat.' : 'Security designed with intention.'}
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="luxury-card p-8">
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full border border-gold-muted">
                <ShieldCheck className="size-6 text-gold" />
              </div>
              <h3 className="card-title mb-3">
                {isRomanian ? 'Construit pentru acces securizat din prima zi.' : 'Built for secure access from day one.'}
              </h3>
              <p className="font-body text-sm text-muted-foreground mb-6">
                {isRomanian
                  ? 'Conturile noi sunt salvate in baza de date cu parole hash-uite, autentificare JWT si protectie coerenta pe tot API-ul.'
                  : 'New accounts are stored in the database with hashed passwords, JWT authentication, and consistent API protection.'}
              </p>
              <div className="space-y-3">
                {securityHighlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 text-gold" />
                    <span className="font-body text-sm text-muted-foreground">{highlight}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="luxury-card p-8">
              <div className="section-label mb-3">{isRomanian ? 'DE CE CONTEAZA' : 'WHY IT MATTERS'}</div>
              <h3 className="card-title mb-3">
                {isRomanian ? 'Control fiabil, chiar si dupa refresh.' : 'Reliable control, even after refresh.'}
              </h3>
              <p className="font-body text-sm text-muted-foreground mb-6">
                {isRomanian
                  ? 'Sesiunea ramane valida corect dupa refresh, iar conturile noi intra direct in acelasi workspace protejat.'
                  : 'The session remains valid after refresh, and new accounts land directly in the same protected workspace.'}
              </p>
              <Button onClick={openRegister} className="w-full bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                {isRomanian ? 'Creeaza-ti contul' : 'Create your account'}
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="mb-2">
              <span className="section-label">{isRomanian ? 'COMPANIE' : 'COMPANY'}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">
              {isRomanian ? 'Mai mult decat un dashboard.' : 'More than a dashboard.'}
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {companyCards.map((card) => (
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
              <span className="section-label">{isRomanian ? 'SUPORT' : 'SUPPORT'}</span>
            </div>
            <h2 className="font-display text-5xl font-light text-foreground">
              {isRomanian ? 'Suport care chiar ajuta.' : 'Support that truly helps.'}
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {supportCards.map((card) => (
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
            <div className="section-label mb-3">{isRomanian ? 'GATA DE START' : 'READY TO START'}</div>
            <h2 className="font-display text-4xl font-light text-foreground mb-4">
              {isRomanian ? 'Creeaza workspace-ul si adu toate camerele impreuna.' : 'Create your workspace and bring every room together.'}
            </h2>
            <p className="mx-auto max-w-2xl font-body text-sm text-muted-foreground mb-8">
              {isRomanian
                ? 'Creeaza un cont nou sau foloseste contul implicit de administrator daca vrei sa inspectezi aplicatia imediat.'
                : 'Create a new account or use the default administrator account if you want to inspect the app right away.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button onClick={openRegister} className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider">
                <UserPlus className="size-4" />
                {isRomanian ? 'Creeaza cont' : 'Create account'}
              </Button>
              <Button variant="outline" onClick={openLogin} className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider">
                {isRomanian ? 'Autentificare' : 'Sign in'}
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
              <p className="font-body text-sm text-muted-foreground">
                {isRomanian ? 'Automatizare smart home premium pentru un stil de viata modern.' : 'Premium smart home automation for a modern lifestyle.'}
              </p>
            </div>
            <div>
              <h4 className="section-label mb-4">{isRomanian ? 'PRODUS' : 'PRODUCT'}</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-gold transition-colors">{isRomanian ? 'Functionalitati' : 'Features'}</a></li>
                <li><a href="#pricing" className="hover:text-gold transition-colors">{isRomanian ? 'Preturi' : 'Pricing'}</a></li>
                <li><a href="#security" className="hover:text-gold transition-colors">{isRomanian ? 'Securitate' : 'Security'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="section-label mb-4">{isRomanian ? 'COMPANIE' : 'COMPANY'}</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-gold transition-colors">{isRomanian ? 'Despre' : 'About'}</a></li>
                <li><a href="#blog" className="hover:text-gold transition-colors">Blog</a></li>
                <li><a href="#careers" className="hover:text-gold transition-colors">{isRomanian ? 'Cariere' : 'Careers'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="section-label mb-4">{isRomanian ? 'SUPORT' : 'SUPPORT'}</h4>
              <ul className="space-y-2 font-body text-sm text-muted-foreground">
                <li><a href="#support" className="hover:text-gold transition-colors">{isRomanian ? 'Centru de ajutor' : 'Help Center'}</a></li>
                <li><a href="#contact" className="hover:text-gold transition-colors">Contact</a></li>
                <li><a href="#privacy" className="hover:text-gold transition-colors">{isRomanian ? 'Confidentialitate' : 'Privacy'}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center font-body text-sm text-muted-foreground">
            <p>&copy; 2026 NEXUS HOME. {isRomanian ? 'Toate drepturile rezervate.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="bg-card border-gold-muted">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{isRomanian ? 'Demo produs' : 'Product demo'}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              {isRomanian
                ? 'Acest preview ghidat iti arata acelasi flux pe care il vede utilizatorul dupa ce isi creeaza contul.'
                : 'This guided preview shows the same flow a user sees after creating an account.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(isRomanian
              ? [
                  'Monitorizezi camerele, dispozitivele si statusul live dintr-un singur panou.',
                  'Creezi automatizari care pornesc la timp fix si continua la intervale recurente.',
                  'Primesti notificari live si iti administrezi contul din navigatia de sus.',
                ]
              : [
                  'Monitor rooms, devices, and live status from a single dashboard.',
                  'Create automations that start on time and continue on recurring intervals.',
                  'Receive live notifications and manage your account from the top navigation.',
                ]).map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-gold-muted/50 bg-background/60 p-4">
                <PlayCircle className="mt-0.5 size-4 text-gold" />
                <span className="font-body text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-background uppercase tracking-wider">
              <a href="#features">{isRomanian ? 'Vezi functionalitatile' : 'Explore features'}</a>
            </Button>
            <Button
              onClick={() => {
                setIsDemoOpen(false)
                openRegister()
              }}
              className="bg-gold text-background hover:bg-gold-light uppercase tracking-wider"
            >
              {isRomanian ? 'Creeaza cont' : 'Create account'}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent className="bg-card border-gold-muted">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{isRomanian ? 'Bine ai revenit' : 'Welcome back'}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              {isRomanian ? 'Autentifica-te in workspace-ul tau smart home.' : 'Sign in to your smart home workspace.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div>
              <label className="section-label text-xs mb-2 block">{isRomanian ? 'Utilizator' : 'Username'}</label>
              <Input
                value={credentials.username}
                onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
                placeholder="admin"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{isRomanian ? 'Parola' : 'Password'}</label>
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
              {isLoginLoading
                ? (isRomanian ? 'Se autentifica...' : 'Signing in...')
                : (isRomanian ? 'Autentificare' : 'Sign in')}
            </Button>
            <div className="space-y-2 text-center">
              <p className="text-xs text-muted-foreground font-body">
                {isRomanian ? 'Cont administrator implicit: admin / assist2026' : 'Default administrator account: admin / assist2026'}
              </p>
              <button
                type="button"
                onClick={openRegister}
                className="text-xs uppercase tracking-wider text-gold hover:text-gold-light"
              >
                {isRomanian ? 'Ai nevoie de cont? Creeaza unul' : 'Need an account? Sign up'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="bg-card border-gold-muted">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-gold">{isRomanian ? 'Creeaza-ti contul' : 'Create your account'}</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              {isRomanian ? 'Inregistreaza-te si intri direct in workspace-ul tau smart home.' : 'Sign up and go straight into your smart home workspace.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 mt-4">
            <div>
              <label className="section-label text-xs mb-2 block">{isRomanian ? 'Nume afisat' : 'Display name'}</label>
              <Input
                value={registerForm.displayName}
                onChange={(event) => setRegisterForm({ ...registerForm, displayName: event.target.value })}
                placeholder="Alex Morgan"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{isRomanian ? 'Utilizator' : 'Username'}</label>
              <Input
                value={registerForm.username}
                onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })}
                placeholder="alex"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">Email</label>
              <Input
                type="email"
                value={registerForm.email}
                onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                placeholder="alex@example.com"
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{isRomanian ? 'Parola' : 'Password'}</label>
              <Input
                type="password"
                value={registerForm.password}
                onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                placeholder={isRomanian ? 'Minimum 8 caractere' : 'Minimum 8 characters'}
                className="bg-background border-gold-muted focus:border-gold"
              />
            </div>
            <div>
              <label className="section-label text-xs mb-2 block">{isRomanian ? 'Confirma parola' : 'Confirm password'}</label>
              <Input
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) => setRegisterForm({ ...registerForm, confirmPassword: event.target.value })}
                placeholder={isRomanian ? 'Repeta parola' : 'Repeat the password'}
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
              {isRegisterLoading
                ? (isRomanian ? 'Se creeaza contul...' : 'Creating account...')
                : (isRomanian ? 'Creeaza cont' : 'Sign up')}
            </Button>
            <div className="space-y-2 text-center">
              <p className="text-xs text-muted-foreground font-body">
                {isRomanian
                  ? 'Contul tau este salvat in baza de date a aplicatiei si autentificat imediat dupa inregistrare.'
                  : 'Your account is stored in the app database and signed in immediately after registration.'}
              </p>
              <button
                type="button"
                onClick={openLogin}
                className="text-xs uppercase tracking-wider text-gold hover:text-gold-light"
              >
                {isRomanian ? 'Ai deja cont? Autentifica-te' : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
