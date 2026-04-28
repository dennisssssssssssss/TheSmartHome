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
  Plug,
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
    loading: 'Se încarcă...',
    routeLoading: 'Se încarcă pagina...',
    signOut: 'Deconectare',
    navItems: [
      { icon: LayoutDashboard, label: 'Panou', path: '/app/dashboard' },
      { icon: Home, label: 'Camere și dispozitive', path: '/app/rooms' },
      { icon: GitBranch, label: 'Automatizări', path: '/app/automations' },
      { icon: BatteryCharging, label: 'Energie', path: '/app/energy' },
      { icon: Plug, label: 'Integrări', path: '/app/integrations' },
      { icon: Shield, label: 'Securitate', path: '/app/security' },
      { icon: Bell, label: 'Notificări', path: '/app/notifications' },
      { icon: Settings, label: 'Setări', path: '/app/settings' },
    ] satisfies NavigationItem[],
    topBar: {
      searchPlaceholder: 'Caută camere, dispozitive...',
      connected: 'Conectat',
      disconnected: 'Deconectat',
      openNotifications: 'Deschide notificările',
      notificationsPaused: 'Notificările sunt puse pe pauză',
      openSettings: 'Deschide setările',
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
      { icon: Plug, label: 'Integrations', path: '/app/integrations' },
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
      load: 'Nu am putut încărca panoul principal',
      action: 'Acțiunea nu a putut fi finalizată',
      roomToggle: 'Nu am putut actualiza camera',
      roomToggleUnavailable: 'Această cameră nu are dispozitive ambientale de controlat',
    },
    success: {
      action: 'Acțiunea a fost aplicată',
      roomToggle: 'Camera a fost actualizată',
    },
    greetings: {
      morning: 'Bună dimineața',
      afternoon: 'Bună ziua',
      evening: 'Bună seara',
    },
    stats: {
      devices: 'Dispozitive în total',
      active: 'Active acum',
      rooms: 'Camere',
      energyToday: 'Consum astăzi',
      weekTrend: 'săptămâna aceasta',
    },
    quickActions: {
      title: 'Scurtături utile',
      items: [
        { id: 'all-lights-off', label: 'Stinge toate luminile' },
        { id: 'lock-all-doors', label: 'Încuie toate ușile' },
        { id: 'activate-security', label: 'Activează securitatea' },
        { id: 'evening-mode', label: 'Atmosferă de seară' },
        { id: 'good-night', label: 'Noapte bună' },
      ],
    },
    onboarding: {
      eyebrow: 'PRIMII PAȘI',
      title: 'Pune casa în ordine fără pași inutili.',
      description:
        'Începi cu camerele, continui cu dispozitivele și închizi cercul cu o automatizare reală. Așa rămâne totul clar și ușor de extins.',
      progress: (completed: number, total: number) => `${completed}/${total} pași finalizați`,
      complete: 'Finalizat',
      steps: {
        rooms: {
          title: 'Creează prima cameră',
          description: 'Pornește de la spațiile reale ale locuinței, nu de la o listă dezordonată de dispozitive.',
          action: 'Adaugă cameră',
          href: '/app/rooms?createRoom=1',
        },
        devices: {
          title: 'Adaugă primul dispozitiv',
          description: 'Pune fiecare dispozitiv direct în camera în care chiar va fi folosit.',
          action: 'Adaugă dispozitiv',
          href: '/app/rooms?createDevice=1',
        },
        automations: {
          title: 'Creează prima automatizare',
          description: 'Leagă dispozitivele printr-o rutină clară, pe care o poți înțelege și ajusta ușor.',
          action: 'Creează automatizare',
          href: '/app/automations?create=1',
        },
      },
    },
    rooms: {
      title: 'Camere',
      viewAll: 'Vezi tot',
      activeComfort: (active: number, total: number) => `${active} din ${total} dispozitive ambientale active`,
      emptyComfort: 'Nu există încă dispozitive ambientale',
    },
    activity: {
      title: 'Activitate recentă',
      empty: 'Nu există activitate recentă încă.',
      unknownDevice: 'Dispozitiv necunoscut',
    },
    energy: {
      title: 'Consum de energie',
      today: 'Astăzi',
      thisWeek: 'Săptămâna aceasta',
      vsPreviousDay: 'Vs ziua precedentă',
      previousDayHint: 'față de ziua precedentă',
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
      loginFallbackError: 'Nu te poți autentifica acum.',
      registerFallbackError: 'Nu îți poți crea contul acum.',
      passwordMismatch: 'Parolele nu coincid.',
      signIn: 'Autentificare',
      getStarted: 'Începe acum',
      watchDemo: 'Vezi demo',
      welcomeBack: 'Bine ai revenit',
      welcomeDescription: 'Intră în workspace-ul tău smart home.',
      username: 'Utilizator',
      password: 'Parolă',
      signingIn: 'Se autentifică...',
      defaultAdminHint: 'Cont administrator implicit: admin / assist2026',
      needAccount: 'Ai nevoie de cont? Creează unul',
      createAccountTitle: 'Creează-ți contul',
      createAccountDescription:
        'Te înregistrezi o dată și intri direct într-un spațiu de control clar, sigur și pregătit pentru demo sau pilot.',
      displayName: 'Nume afișat',
      email: 'Email',
      confirmPassword: 'Confirmă parola',
      minimumCharacters: 'Minimum 8 caractere',
      repeatPassword: 'Repetă parola',
      creatingAccount: 'Se creează contul...',
      createAccount: 'Creează cont',
      accountStoredHint:
        'Contul tău este salvat în baza de date a aplicației și autentificat imediat după înregistrare.',
      alreadyHaveAccount: 'Ai deja cont? Autentifică-te',
    },
    nav: {
      features: 'Funcționalități',
      pricing: 'Pachete',
      company: 'Despre',
      support: 'Suport',
    },
    hero: {
      eyebrow: 'PLATFORMA SMART HOME',
      lineOne: 'Casa ta.',
      lineTwo: 'Clar organizată.',
      lineThree: 'Cu adevărat vie.',
      description:
        'O platformă care transformă controlul unei case smart într-o experiență calmă, premium și ușor de demonstrat.',
      trust: 'Pregătită pentru demo-uri, piloturi și implementări premium.',
      highlights: [
        'Configurare pe camere, nu pe haos',
        'Automatizări recurente care chiar rulează',
        'Notificări live și securitate coerentă',
      ],
    },
    featuresSection: {
      eyebrow: 'FUNCȚIONALITĂȚI',
      title: 'Totul într-un singur flux coerent.',
      items: [
        {
          icon: Home,
          title: 'Control unificat',
          description:
            'Administrezi camere, dispozitive și rutine dintr-o interfață care nu te obligă să cauți prin liste confuze.',
        },
        {
          icon: Zap,
          title: 'Automatizări reale',
          description:
            'Construiești fluxuri recurente care pornesc la timp și rămân ușor de înțeles.',
        },
        {
          icon: TrendingUp,
          title: 'Vizibilitate pe consum',
          description:
            'Vezi energia într-un mod clar, util pentru optimizare și discuții cu clientul.',
        },
        {
          icon: Shield,
          title: 'Securitate solidă',
          description:
            'Parole hash-uite, JWT și notificări live pentru traseele care contează cu adevărat.',
        },
        {
          icon: Smartphone,
          title: 'Acces din rețea',
          description:
            'Poți deschide aplicația și de pe alt PC din aceeași rețea, fără setup complicat.',
        },
        {
          icon: Lock,
          title: 'Control cu context',
          description:
            'Totul este organizat pe camere și scenarii, nu pe butoane aruncate fără logică.',
        },
      ] satisfies LandingFeature[],
    },
    howItWorks: {
      eyebrow: 'CUM FUNCȚIONEAZĂ',
      title: 'Simplu pentru utilizator, sănătos pentru produs.',
      steps: [
        {
          num: '01',
          title: 'Definești camerele',
          desc: 'Organizezi locuința așa cum o vede utilizatorul final: pe spații reale, nu pe tabele tehnice.',
        },
        {
          num: '02',
          title: 'Așezi dispozitivele corect',
          desc: 'Fiecare dispozitiv intră direct în contextul său, iar controlul devine firesc.',
        },
        {
          num: '03',
          title: 'Activezi comportamentele',
          desc: 'Rutinele, securitatea și notificările capătă logică și consistență din prima.',
        },
      ] satisfies LandingStep[],
    },
    pricingSection: {
      eyebrow: 'IMPLEMENTARE',
      title: 'Alege ritmul potrivit pentru lansare.',
      popular: 'RECOMANDAT',
      perMonth: '',
      tiers: [
        {
          name: 'Showcase',
          price: 'PoC',
          features: [
            'Flux complet pentru demo și prezentare',
            'Autentificare, camere și dispozitive gata de explorat',
            'Potrivit pentru validare rapidă și review intern',
            'Bază bună pentru feedback de produs',
          ],
        },
        {
          name: 'Pilot asistat',
          price: 'Pilot',
          popular: true,
          features: [
            'Acces din rețea locală pentru demo extins',
            'Automatizări, securitate și notificări live',
            'Flux clar pentru onboarding și testare',
            'Spațiu bun pentru rafinare înainte de rollout',
          ],
        },
        {
          name: 'Enterprise rollout',
          price: 'Custom',
          features: [
            'Extensii și integrări dedicate',
            'Politici de securitate și branding adaptat',
            'Plan de deployment și suport dedicat',
            'Pregătit pentru scenarii multi-locație',
          ],
        },
      ] satisfies PricingTier[],
    },
    securitySection: {
      eyebrow: 'SECURITY',
      title: 'Securitate gândită intenționat.',
      cardTitle: 'Construit pentru acces securizat din prima zi.',
      cardDescription:
        'Conturile noi sunt salvate în baza de date cu parole hash-uite, autentificare JWT și protecție coerentă pe tot API-ul.',
      highlights: [
        'Acces JWT pentru fiecare apel protejat către API',
        'Stocare securizată a parolelor cu PBKDF2 și salt unic',
        'Actualizări live pentru dispozitive și notificări prin SignalR',
      ],
      secondaryEyebrow: 'DE CE CONTEAZĂ',
      secondaryTitle: 'Control fiabil, chiar și după refresh.',
      secondaryDescription:
        'Sesiunea rămâne validă după refresh, iar conturile noi intră direct în același workspace protejat.',
      secondaryCta: 'Creează-ți contul',
    },
    companySection: {
      eyebrow: 'COMPANIE',
      title: 'Mai mult decât un dashboard.',
      cards: [
        {
          id: 'about',
          icon: ShieldCheck,
          title: 'Despre',
          description:
            'NEXUS HOME aduce design premium, orchestrare hardware și fluxuri sigure într-o singură platformă de control.',
        },
        {
          id: 'blog',
          icon: Newspaper,
          title: 'Blog',
          description:
            'Note de produs, actualizări și idei de automatizare pentru o locuință care funcționează firesc.',
        },
        {
          id: 'careers',
          icon: Briefcase,
          title: 'Cariere',
          description:
            'Construim echipe în product design, sisteme embedded și operațiuni asistate de AI.',
        },
      ] satisfies LandingCard[],
    },
    supportSection: {
      eyebrow: 'SUPORT',
      title: 'Suport care chiar ajută.',
      cards: [
        {
          id: 'support',
          icon: LifeBuoy,
          title: 'Centru de ajutor',
          description:
            'Ghiduri de configurare, pairing pentru dispozitive și pași clari pentru rezolvarea automatizărilor.',
        },
        {
          id: 'contact',
          icon: Mail,
          title: 'Contact',
          description:
            'Contactează echipa de suport la support@nexushome.local pentru onboarding, demo sau intervenții rapide.',
        },
        {
          id: 'privacy',
          icon: ScrollText,
          title: 'Confidențialitate',
          description:
            'Colectăm doar datele necesare pentru securizarea contului și automatizarea rutinei tale.',
        },
      ] satisfies LandingCard[],
    },
    ctaSection: {
      eyebrow: 'GATA DE START',
      title: 'Creează workspace-ul și adu toate camerele împreună.',
      description:
        'Creează un cont nou sau folosește contul implicit de administrator dacă vrei să intri imediat într-o versiune pregătită de explorat.',
    },
    footer: {
      description: 'Automatizare smart home premium pentru un stil de viață modern.',
      product: 'PRODUS',
      company: 'COMPANIE',
      support: 'SUPORT',
      features: 'Funcționalități',
      pricing: 'Pachete',
      security: 'Securitate',
      helpCenter: 'Centru de ajutor',
      contact: 'Contact',
      privacy: 'Confidențialitate',
      about: 'Despre',
      blog: 'Blog',
      careers: 'Cariere',
      rights: 'Toate drepturile rezervate.',
    },
    demo: {
      title: 'Demo produs',
      description:
        'Acest preview ghidat îți arată același flux pe care îl vede utilizatorul după ce își creează contul.',
      items: [
        'Monitorizezi camerele, dispozitivele și statusul live dintr-un singur panou.',
        'Creezi automatizări care pornesc la timp fix și continuă la intervale recurente.',
        'Primești notificări live și îți administrezi contul din navigația de sus.',
      ],
      exploreFeatures: 'Vezi funcționalitățile',
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
      accountStoredHint:
        'Your account is stored in the app database and signed in immediately after registration.',
      alreadyHaveAccount: 'Already have an account? Sign in',
    },
    nav: {
      features: 'Features',
      pricing: 'Packages',
      company: 'About',
      support: 'Support',
    },
    hero: {
      eyebrow: 'SMART HOME PLATFORM',
      lineOne: 'Your home.',
      lineTwo: 'Clearly organized.',
      lineThree: 'Truly alive.',
      description:
        'A platform that turns smart-home control into something calm, premium, and easy to demo with confidence.',
      trust: 'Ready for demos, pilots, and premium rollouts.',
      highlights: [
        'Room-first setup instead of flat chaos',
        'Recurring automations that actually run',
        'Live notifications with coherent security flows',
      ],
    },
    featuresSection: {
      eyebrow: 'FEATURES',
      title: 'Everything in one coherent flow.',
      items: [
        {
          icon: Home,
          title: 'Unified control',
          description:
            'Manage rooms, devices, and routines from one surface that does not feel like a spreadsheet.',
        },
        {
          icon: Zap,
          title: 'Real automations',
          description:
            'Build recurring routines that start on time and remain easy to understand.',
        },
        {
          icon: TrendingUp,
          title: 'Energy visibility',
          description:
            'Turn raw usage into something useful for optimization and stakeholder reviews.',
        },
        {
          icon: Shield,
          title: 'Solid security',
          description:
            'Hashed passwords, JWT, and live notifications protect the paths that matter.',
        },
        {
          icon: Smartphone,
          title: 'LAN-ready access',
          description:
            'Open the app from another PC on the same network without extra ceremony.',
        },
        {
          icon: Lock,
          title: 'Context-first control',
          description:
            'Everything is organized around rooms and scenarios, not disconnected buttons.',
        },
      ] satisfies LandingFeature[],
    },
    howItWorks: {
      eyebrow: 'HOW IT WORKS',
      title: 'Simple for users, healthy for the product.',
      steps: [
        {
          num: '01',
          title: 'Define the rooms',
          desc: 'Model the home the way real users think about it: as spaces, not technical records.',
        },
        {
          num: '02',
          title: 'Place devices with intent',
          desc: 'Every device is assigned where it belongs, so control stays intuitive.',
        },
        {
          num: '03',
          title: 'Activate behavior',
          desc: 'Automations, security, and notifications become clear and consistent from the start.',
        },
      ] satisfies LandingStep[],
    },
    pricingSection: {
      eyebrow: 'DELIVERY',
      title: 'Choose the right rollout rhythm.',
      popular: 'RECOMMENDED',
      perMonth: '',
      tiers: [
        {
          name: 'Showcase',
          price: 'PoC',
          features: [
            'End-to-end flow for demos and presentations',
            'Authentication, rooms, and devices ready to explore',
            'Strong fit for internal validation and early reviews',
            'Useful baseline for product feedback',
          ],
        },
        {
          name: 'Guided pilot',
          price: 'Pilot',
          popular: true,
          features: [
            'LAN access for broader demos',
            'Automations, security, and live notifications',
            'Clear onboarding and testable product flows',
            'Space for refinement before a wider rollout',
          ],
        },
        {
          name: 'Enterprise rollout',
          price: 'Custom',
          features: [
            'Dedicated integrations and delivery needs',
            'Custom security policies and branding',
            'Deployment plan with dedicated support',
            'Ready for multi-location growth',
          ],
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
          description:
            'NEXUS HOME brings premium design, hardware orchestration, and secure workflows into one control surface.',
        },
        {
          id: 'blog',
          icon: Newspaper,
          title: 'Blog',
          description:
            'Product notes, updates, and automation ideas for homes that should feel effortless.',
        },
        {
          id: 'careers',
          icon: Briefcase,
          title: 'Careers',
          description:
            'We are building teams across product design, embedded systems, and AI-assisted operations.',
        },
      ] satisfies LandingCard[],
    },
    supportSection: {
      eyebrow: 'SUPPORT',
      title: 'Support that actually helps.',
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
          description:
            'Reach the support team at support@nexushome.local for onboarding or urgent issues.',
        },
        {
          id: 'privacy',
          icon: ScrollText,
          title: 'Privacy',
          description:
            'We collect only the data required to secure the account and automate your routines.',
        },
      ] satisfies LandingCard[],
    },
    ctaSection: {
      eyebrow: 'READY TO START',
      title: 'Create the workspace and bring every room together.',
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
