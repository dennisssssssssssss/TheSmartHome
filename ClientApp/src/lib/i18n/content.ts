import type { AppLocale } from '@/lib/preferences'
import {
  BatteryCharging,
  Bell,
  Briefcase,
  GitBranch,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Mail,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'

type NavigationItem = {
  icon: LucideIcon
  label: string
  path: string
}

type LandingCard = {
  id: string
  icon: LucideIcon
  title: string
  description: string
}

type LandingStep = {
  num: string
  title: string
  desc: string
}

type PricingTier = {
  name: string
  price: string
  popular?: boolean
  features: string[]
}

type LandingFeature = {
  icon: LucideIcon
  title: string
  description: string
}

const SHELL_CONTENT = {
  ro: {
    loading: 'Se incarca...',
    routeLoading: 'Se incarca pagina...',
    signOut: 'Deconectare',
    navItems: [
      { icon: LayoutDashboard, label: 'Panou', path: '/app/dashboard' },
      { icon: Home, label: 'Camere si dispozitive', path: '/app/rooms' },
      { icon: GitBranch, label: 'Automatizari', path: '/app/automations' },
      { icon: BatteryCharging, label: 'Energie', path: '/app/energy' },
      { icon: Shield, label: 'Securitate', path: '/app/security' },
      { icon: Bell, label: 'Notificari', path: '/app/notifications' },
      { icon: Settings, label: 'Setari', path: '/app/settings' },
    ] satisfies NavigationItem[],
    topBar: {
      searchPlaceholder: 'Cauta camere, dispozitive...',
      connected: 'Conectat',
      disconnected: 'Deconectat',
      openNotifications: 'Deschide notificarile',
      notificationsPaused: 'Notificarile sunt puse pe pauza',
      openSettings: 'Deschide setarile',
    },
  },
  en: {
    loading: 'Loading...',
    routeLoading: 'Loading page...',
    signOut: 'Sign out',
    navItems: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/app/dashboard' },
      { icon: Home, label: 'Rooms & Devices', path: '/app/rooms' },
      { icon: GitBranch, label: 'Automations', path: '/app/automations' },
      { icon: BatteryCharging, label: 'Energy', path: '/app/energy' },
      { icon: Shield, label: 'Security', path: '/app/security' },
      { icon: Bell, label: 'Notifications', path: '/app/notifications' },
      { icon: Settings, label: 'Settings', path: '/app/settings' },
    ] satisfies NavigationItem[],
    topBar: {
      searchPlaceholder: 'Search rooms, devices...',
      connected: 'Connected',
      disconnected: 'Disconnected',
      openNotifications: 'Open notifications',
      notificationsPaused: 'Notifications are paused',
      openSettings: 'Open settings',
    },
  },
} as const

const DASHBOARD_CONTENT = {
  ro: {
    errors: {
      load: 'Nu am putut incarca panoul principal',
      action: 'Actiunea nu a putut fi finalizata',
      roomToggle: 'Nu am putut actualiza camera',
      roomToggleUnavailable: 'Aceasta camera nu are dispozitive ambient de controlat',
    },
    success: {
      action: 'Actiunea a fost aplicata',
      roomToggle: 'Camera a fost actualizata',
    },
    greetings: {
      morning: 'Buna dimineata',
      afternoon: 'Buna ziua',
      evening: 'Buna seara',
    },
    stats: {
      devices: 'Dispozitive totale',
      active: 'Active acum',
      rooms: 'Camere',
      energyToday: 'Consum astazi',
      weekTrend: 'saptamana aceasta',
    },
    quickActions: {
      title: 'Actiuni rapide',
      items: [
        { id: 'all-lights-off', label: 'Stinge toate luminile' },
        { id: 'lock-all-doors', label: 'Incuie toate usile' },
        { id: 'activate-security', label: 'Activeaza securitatea' },
        { id: 'evening-mode', label: 'Mod de seara' },
        { id: 'good-night', label: 'Noapte buna' },
      ],
    },
    onboarding: {
      eyebrow: 'PRIMII PASI',
      title: 'Configureaza locuinta in ordinea corecta.',
      description:
        'Fluxul recomandat este simplu: creezi camera, adaugi dispozitivul, apoi construiesti prima automatizare.',
      progress: (completed: number, total: number) => `${completed}/${total} pasi finalizati`,
      complete: 'Finalizat',
      steps: {
        rooms: {
          title: 'Creeaza prima camera',
          description: 'Porneste de la structura locuintei, nu de la o lista de dispozitive.',
          action: 'Adauga camera',
          href: '/app/rooms?createRoom=1',
        },
        devices: {
          title: 'Adauga primul dispozitiv',
          description: 'Aloca fiecare dispozitiv direct in camera potrivita.',
          action: 'Adauga dispozitiv',
          href: '/app/rooms?createDevice=1',
        },
        automations: {
          title: 'Creeaza prima automatizare',
          description: 'Leaga dispozitivele intre ele printr-o rutina usor de inteles.',
          action: 'Creeaza automatizare',
          href: '/app/automations?create=1',
        },
      },
    },
    rooms: {
      title: 'Camere',
      viewAll: 'Vezi tot',
      activeComfort: (active: number, total: number) => `${active} din ${total} dispozitive ambient active`,
      emptyComfort: 'Nu exista dispozitive ambient',
    },
    activity: {
      title: 'Activitate recenta',
      empty: 'Nu exista activitate recenta inca.',
      unknownDevice: 'Dispozitiv necunoscut',
    },
    energy: {
      title: 'Consum energie',
      today: 'Astazi',
      thisWeek: 'Saptamana aceasta',
      vsPreviousDay: 'Vs ziua precedenta',
      previousDayHint: 'fata de ziua precedenta',
    },
  },
  en: {
    errors: {
      load: 'Failed to load the dashboard',
      action: 'The action could not be completed',
      roomToggle: 'Failed to update the room',
      roomToggleUnavailable: 'This room has no comfort devices to control',
    },
    success: {
      action: 'Action applied successfully',
      roomToggle: 'Room updated successfully',
    },
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    stats: {
      devices: 'Total devices',
      active: 'Active now',
      rooms: 'Rooms',
      energyToday: 'Energy today',
      weekTrend: 'this week',
    },
    quickActions: {
      title: 'Quick actions',
      items: [
        { id: 'all-lights-off', label: 'Turn off all lights' },
        { id: 'lock-all-doors', label: 'Lock all doors' },
        { id: 'activate-security', label: 'Activate security' },
        { id: 'evening-mode', label: 'Evening mode' },
        { id: 'good-night', label: 'Good night' },
      ],
    },
    onboarding: {
      eyebrow: 'FIRST STEPS',
      title: 'Set up the home in the right order.',
      description:
        'The recommended flow is simple: create the room, add the device, then build the first automation.',
      progress: (completed: number, total: number) => `${completed}/${total} steps completed`,
      complete: 'Completed',
      steps: {
        rooms: {
          title: 'Create the first room',
          description: 'Start from the structure of the home, not from a flat device list.',
          action: 'Add room',
          href: '/app/rooms?createRoom=1',
        },
        devices: {
          title: 'Add the first device',
          description: 'Assign every device directly to the room where it belongs.',
          action: 'Add device',
          href: '/app/rooms?createDevice=1',
        },
        automations: {
          title: 'Create the first automation',
          description: 'Connect devices through a routine that is easy to understand.',
          action: 'Create automation',
          href: '/app/automations?create=1',
        },
      },
    },
    rooms: {
      title: 'Rooms',
      viewAll: 'View all',
      activeComfort: (active: number, total: number) => `${active} of ${total} comfort devices active`,
      emptyComfort: 'No comfort devices yet',
    },
    activity: {
      title: 'Recent activity',
      empty: 'No recent activity yet.',
      unknownDevice: 'Unknown device',
    },
    energy: {
      title: 'Energy consumption',
      today: 'Today',
      thisWeek: 'This week',
      vsPreviousDay: 'Vs previous day',
      previousDayHint: 'compared with the previous day',
    },
  },
} as const

const LANDING_CONTENT = {
  ro: {
    auth: {
      loginFallbackError: 'Nu te poti autentifica acum.',
      registerFallbackError: 'Nu iti poti crea contul acum.',
      passwordMismatch: 'Parolele nu coincid.',
      signIn: 'Autentificare',
      getStarted: 'Incepe acum',
      watchDemo: 'Vezi demo',
      welcomeBack: 'Bine ai revenit',
      welcomeDescription: 'Autentifica-te in workspace-ul tau smart home.',
      username: 'Utilizator',
      password: 'Parola',
      signingIn: 'Se autentifica...',
      defaultAdminHint: 'Cont administrator implicit: admin / assist2026',
      needAccount: 'Ai nevoie de cont? Creeaza unul',
      createAccountTitle: 'Creeaza-ti contul',
      createAccountDescription: 'Inregistreaza-te si intri direct in workspace-ul tau smart home.',
      displayName: 'Nume afisat',
      email: 'Email',
      confirmPassword: 'Confirma parola',
      minimumCharacters: 'Minimum 8 caractere',
      repeatPassword: 'Repeta parola',
      creatingAccount: 'Se creeaza contul...',
      createAccount: 'Creeaza cont',
      accountStoredHint:
        'Contul tau este salvat in baza de date a aplicatiei si autentificat imediat dupa inregistrare.',
      alreadyHaveAccount: 'Ai deja cont? Autentifica-te',
    },
    nav: {
      features: 'Functionalitati',
      pricing: 'Preturi',
      company: 'Companie',
      support: 'Suport',
    },
    hero: {
      eyebrow: 'PLATFORMA SMART HOME',
      lineOne: 'Casa ta.',
      lineTwo: 'Inteligenta.',
      lineThree: 'Fara efort.',
      description: 'Descopera automatizarea premium, cu control clar si o experienta rafinata.',
      trust: 'Ales deja de peste 12.000 de locuinte din intreaga lume',
    },
    featuresSection: {
      eyebrow: 'FUNCTIONALITATI',
      title: 'Tot ce ai nevoie.',
      items: [
        { icon: Home, title: 'Control unificat', description: 'Administrezi toate dispozitivele dintr-o singura interfata eleganta.' },
        { icon: Zap, title: 'Automatizari inteligente', description: 'Creezi rutine care se adapteaza la stilul tau de viata.' },
        { icon: TrendingUp, title: 'Vizibilitate energie', description: 'Monitorizezi consumul si reduci costurile energetice.' },
        { icon: Shield, title: 'Securitate enterprise', description: 'Criptarea si autentificarea moderna iti protejeaza datele.' },
        { icon: Smartphone, title: 'Acces de oriunde', description: 'Iti accesezi locuinta de pe orice dispozitiv, oriunde te afli.' },
        { icon: Lock, title: 'Confidentialitate reala', description: 'Datele tale raman ale tale. Intotdeauna.' },
      ] satisfies LandingFeature[],
    },
    howItWorks: {
      eyebrow: 'CUM FUNCTIONEAZA',
      title: 'Simplu prin design.',
      steps: [
        { num: '01', title: 'Conectezi dispozitivele', desc: 'Adaugi rapid dispozitivele smart cu un flux clar de configurare.' },
        { num: '02', title: 'Definesti rutinele', desc: 'Creezi automatizari care urmeaza ritmul tau zilnic.' },
        { num: '03', title: 'Te bucuri de rezultat', desc: 'Casa reactioneaza mai rapid, mai elegant si mai coerent.' },
      ] satisfies LandingStep[],
    },
    pricingSection: {
      eyebrow: 'PRETURI',
      title: 'Alege planul potrivit.',
      popular: 'CEL MAI ALES',
      perMonth: '/luna',
      tiers: [
        { name: 'Start', price: '$19', features: ['Pana la 10 dispozitive', 'Automatizari de baza', 'Acces din aplicatie', 'Suport pe email'] },
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
      ] satisfies PricingTier[],
    },
    securitySection: {
      eyebrow: 'SECURITY',
      title: 'Securitate gandita intentionat.',
      cardTitle: 'Construit pentru acces securizat din prima zi.',
      cardDescription:
        'Conturile noi sunt salvate in baza de date cu parole hash-uite, autentificare JWT si protectie coerenta pe tot API-ul.',
      highlights: [
        'Acces JWT pentru fiecare apel protejat catre API',
        'Stocare securizata a parolelor cu PBKDF2 si salt unic',
        'Actualizari live pentru dispozitive si notificari prin SignalR',
      ],
      secondaryEyebrow: 'DE CE CONTEAZA',
      secondaryTitle: 'Control fiabil, chiar si dupa refresh.',
      secondaryDescription:
        'Sesiunea ramane valida corect dupa refresh, iar conturile noi intra direct in acelasi workspace protejat.',
      secondaryCta: 'Creeaza-ti contul',
    },
    companySection: {
      eyebrow: 'COMPANIE',
      title: 'Mai mult decat un dashboard.',
      cards: [
        {
          id: 'about',
          icon: ShieldCheck,
          title: 'Despre',
          description:
            'NEXUS HOME aduce design premium, orchestrare hardware si fluxuri sigure intr-o singura platforma de control.',
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
      ] satisfies LandingCard[],
    },
    supportSection: {
      eyebrow: 'SUPORT',
      title: 'Suport care chiar ajuta.',
      cards: [
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
      ] satisfies LandingCard[],
    },
    ctaSection: {
      eyebrow: 'GATA DE START',
      title: 'Creeaza workspace-ul si adu toate camerele impreuna.',
      description:
        'Creeaza un cont nou sau foloseste contul implicit de administrator daca vrei sa inspectezi aplicatia imediat.',
    },
    footer: {
      description: 'Automatizare smart home premium pentru un stil de viata modern.',
      product: 'PRODUS',
      company: 'COMPANIE',
      support: 'SUPORT',
      features: 'Functionalitati',
      pricing: 'Preturi',
      security: 'Securitate',
      helpCenter: 'Centru de ajutor',
      contact: 'Contact',
      privacy: 'Confidentialitate',
      about: 'Despre',
      blog: 'Blog',
      careers: 'Cariere',
      rights: 'Toate drepturile rezervate.',
    },
    demo: {
      title: 'Demo produs',
      description:
        'Acest preview ghidat iti arata acelasi flux pe care il vede utilizatorul dupa ce isi creeaza contul.',
      items: [
        'Monitorizezi camerele, dispozitivele si statusul live dintr-un singur panou.',
        'Creezi automatizari care pornesc la timp fix si continua la intervale recurente.',
        'Primesti notificari live si iti administrezi contul din navigatia de sus.',
      ],
      exploreFeatures: 'Vezi functionalitatile',
    },
  },
  en: {
    auth: {
      loginFallbackError: 'Unable to sign in right now.',
      registerFallbackError: 'Unable to create your account right now.',
      passwordMismatch: 'Passwords do not match.',
      signIn: 'Sign in',
      getStarted: 'Get started',
      watchDemo: 'Watch demo',
      welcomeBack: 'Welcome back',
      welcomeDescription: 'Sign in to your smart home workspace.',
      username: 'Username',
      password: 'Password',
      signingIn: 'Signing in...',
      defaultAdminHint: 'Default administrator account: admin / assist2026',
      needAccount: 'Need an account? Sign up',
      createAccountTitle: 'Create your account',
      createAccountDescription: 'Sign up and go straight into your smart home workspace.',
      displayName: 'Display name',
      email: 'Email',
      confirmPassword: 'Confirm password',
      minimumCharacters: 'Minimum 8 characters',
      repeatPassword: 'Repeat the password',
      creatingAccount: 'Creating account...',
      createAccount: 'Sign up',
      accountStoredHint: 'Your account is stored in the app database and signed in immediately after registration.',
      alreadyHaveAccount: 'Already have an account? Sign in',
    },
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      company: 'Company',
      support: 'Support',
    },
    hero: {
      eyebrow: 'SMART HOME PLATFORM',
      lineOne: 'Your home.',
      lineTwo: 'Intelligent.',
      lineThree: 'Effortless.',
      description: 'Discover premium automation with clear control and a refined experience.',
      trust: 'Already trusted by over 12,000 homes worldwide',
    },
    featuresSection: {
      eyebrow: 'FEATURES',
      title: 'Everything you need.',
      items: [
        { icon: Home, title: 'Unified control', description: 'Manage every device from a single, elegant interface.' },
        { icon: Zap, title: 'Smart automations', description: 'Create routines that adapt to your daily rhythm.' },
        { icon: TrendingUp, title: 'Energy visibility', description: 'Track consumption and reduce operational costs.' },
        { icon: Shield, title: 'Enterprise security', description: 'Modern encryption and authentication protect your data.' },
        { icon: Smartphone, title: 'Access anywhere', description: 'Reach the home from any device, wherever you are.' },
        { icon: Lock, title: 'Real privacy', description: 'Your data stays yours. Always.' },
      ] satisfies LandingFeature[],
    },
    howItWorks: {
      eyebrow: 'HOW IT WORKS',
      title: 'Simple by design.',
      steps: [
        { num: '01', title: 'Connect your devices', desc: 'Add smart devices quickly through a guided setup flow.' },
        { num: '02', title: 'Define your routines', desc: 'Create automations that follow your daily rhythm.' },
        { num: '03', title: 'Enjoy the result', desc: 'Your home reacts faster, more elegantly, and more coherently.' },
      ] satisfies LandingStep[],
    },
    pricingSection: {
      eyebrow: 'PRICING',
      title: 'Choose the right plan.',
      popular: 'MOST POPULAR',
      perMonth: '/month',
      tiers: [
        { name: 'Starter', price: '$19', features: ['Up to 10 devices', 'Basic automations', 'App access', 'Email support'] },
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
      ] satisfies PricingTier[],
    },
    securitySection: {
      eyebrow: 'SECURITY',
      title: 'Security designed with intention.',
      cardTitle: 'Built for secure access from day one.',
      cardDescription:
        'New accounts are stored in the database with hashed passwords, JWT authentication, and consistent API protection.',
      highlights: [
        'JWT access for every protected API call',
        'Secure password storage with PBKDF2 hashing and unique salts',
        'Live device and notification updates through SignalR',
      ],
      secondaryEyebrow: 'WHY IT MATTERS',
      secondaryTitle: 'Reliable control, even after refresh.',
      secondaryDescription:
        'The session remains valid after refresh, and new accounts land directly in the same protected workspace.',
      secondaryCta: 'Create your account',
    },
    companySection: {
      eyebrow: 'COMPANY',
      title: 'More than a dashboard.',
      cards: [
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
      ] satisfies LandingCard[],
    },
    supportSection: {
      eyebrow: 'SUPPORT',
      title: 'Support that truly helps.',
      cards: [
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
      ] satisfies LandingCard[],
    },
    ctaSection: {
      eyebrow: 'READY TO START',
      title: 'Create your workspace and bring every room together.',
      description:
        'Create a new account or use the default administrator account if you want to inspect the app right away.',
    },
    footer: {
      description: 'Premium smart home automation for a modern lifestyle.',
      product: 'PRODUCT',
      company: 'COMPANY',
      support: 'SUPPORT',
      features: 'Features',
      pricing: 'Pricing',
      security: 'Security',
      helpCenter: 'Help Center',
      contact: 'Contact',
      privacy: 'Privacy',
      about: 'About',
      blog: 'Blog',
      careers: 'Careers',
      rights: 'All rights reserved.',
    },
    demo: {
      title: 'Product demo',
      description: 'This guided preview shows the same flow a user sees after creating an account.',
      items: [
        'Monitor rooms, devices, and live status from a single dashboard.',
        'Create automations that start on time and continue on recurring intervals.',
        'Receive live notifications and manage your account from the top navigation.',
      ],
      exploreFeatures: 'Explore features',
    },
  },
} as const

export function getShellContent(locale: AppLocale) {
  return SHELL_CONTENT[locale]
}

export function getDashboardContent(locale: AppLocale) {
  return DASHBOARD_CONTENT[locale]
}

export function getLandingContent(locale: AppLocale) {
  return LANDING_CONTENT[locale]
}
