import type { AppLocale } from '@/lib/preferences'

const SECURITY_CONTENT = {
  ro: {
    errors: {
      load: 'Nu am putut încărca datele de securitate',
      lockAll: 'Nu am putut securiza toate încuietorile',
      mode: 'Nu am putut aplica modul de securitate',
    },
    success: {
      lockAll: 'Toate încuietorile au fost securizate',
      lockAllDone: 'Toate încuietorile sunt deja securizate',
      modeApplied: 'Modul de securitate a fost aplicat',
    },
    page: {
      eyebrow: 'SECURITATE',
      title: 'Siguranța locuinței tale.',
      lockAll: 'Încuie toate ușile',
      locking: 'Se securizează...',
      manageAutoLock: 'Administrează Auto-Lock',
      loading: 'Se încarcă...',
    },
    status: {
      alert: 'Alertă',
      ready: 'Pregătit',
      secured: 'Securizat',
      monitoring: 'Monitorizare',
      warning: 'Atenție',
      noDevices: 'Adaugă o încuietoare sau o cameră pentru a începe monitorizarea',
      allSecured: 'Toate încuietorile detectate sunt securizate',
      monitoringLocks: (count: number) => `${count} încuietori sunt protejate prin auto-lock`,
      unsecured: 'Una sau mai multe încuietori sunt nesecurizate',
      alertsToday: (count: number) => `${count} alerte de securitate astăzi`,
    },
    stats: {
      system: 'Stare sistem',
      locks: 'Încuietori',
      cameras: 'Camere',
      alerts: 'Alerte',
      securedLocks: (secured: number, total: number) => `${secured}/${total} securizate`,
      onlineCameras: (online: number, total: number) => `${online}/${total} online`,
      alertsToday: (count: number) => `${count} astăzi`,
    },
    modes: {
      title: 'Moduri de securitate',
      home: {
        label: 'Acasă',
        description: 'Păstrează încuietorile și camerele active, dar relaxează senzorii de mișcare.',
      },
      away: {
        label: 'Plecat',
        description:
          'Securizează încuietorile, camerele și senzorii, apoi oprește dispozitivele de prezență.',
      },
      night: {
        label: 'Noapte',
        description:
          'Pregătește casa pentru noapte: încuietori active, senzori activi și luminile principale stinse.',
      },
      active: 'Mod activ',
      custom: 'Personalizat',
    },
    autoLock: {
      title: 'Auto-Lock',
      status: 'STATUS',
      nextRun: 'URMĂTOAREA RULARE',
      protectedDevices: 'DISPOZITIVE PROTEJATE',
      active: 'Activ',
      inactive: 'Inactiv',
      fallback: 'Zilnic la 22:00 când este activ',
      coverage: (protectedCount: number, total: number) => `${protectedCount} din ${total} încuietori sunt acoperite`,
    },
    events: {
      title: 'Evenimente de securitate',
      empty: 'Nu există evenimente de securitate recente',
      types: {
        alert: 'Alertă',
        warning: 'Avertizare',
        activity: 'Activitate',
        info: 'Info',
      },
    },
  },
  en: {
    errors: {
      load: 'Could not load security data',
      lockAll: 'Could not secure all lock devices',
      mode: 'Could not apply the security mode',
    },
    success: {
      lockAll: 'All lock devices were secured',
      lockAllDone: 'All lock devices are already secured',
      modeApplied: 'Security mode applied successfully',
    },
    page: {
      eyebrow: 'SECURITY',
      title: 'Your home safety.',
      lockAll: 'Lock all doors',
      locking: 'Securing...',
      manageAutoLock: 'Manage Auto-Lock',
      loading: 'Loading...',
    },
    status: {
      alert: 'Alert',
      ready: 'Ready',
      secured: 'Secured',
      monitoring: 'Monitoring',
      warning: 'Warning',
      noDevices: 'Add a lock or camera to start monitoring the space',
      allSecured: 'All detected lock devices are secured',
      monitoringLocks: (count: number) => `${count} lock devices are protected by auto-lock`,
      unsecured: 'One or more locks are unsecured',
      alertsToday: (count: number) => `${count} security alerts today`,
    },
    stats: {
      system: 'System status',
      locks: 'Locks',
      cameras: 'Cameras',
      alerts: 'Alerts',
      securedLocks: (secured: number, total: number) => `${secured}/${total} secured`,
      onlineCameras: (online: number, total: number) => `${online}/${total} online`,
      alertsToday: (count: number) => `${count} today`,
    },
    modes: {
      title: 'Security modes',
      home: {
        label: 'Home',
        description: 'Keep locks and cameras active while motion sensors stay relaxed.',
      },
      away: {
        label: 'Away',
        description: 'Secure locks, cameras, and sensors, then turn off presence devices.',
      },
      night: {
        label: 'Night',
        description: 'Prepare the home for night: locks active, sensors active, and the main lights off.',
      },
      active: 'Active mode',
      custom: 'Custom',
    },
    autoLock: {
      title: 'Auto-Lock',
      status: 'STATUS',
      nextRun: 'NEXT RUN',
      protectedDevices: 'PROTECTED DEVICES',
      active: 'Active',
      inactive: 'Inactive',
      fallback: 'Daily at 22:00 when enabled',
      coverage: (protectedCount: number, total: number) => `${protectedCount} of ${total} locks are covered`,
    },
    events: {
      title: 'Security events',
      empty: 'No recent security events',
      types: {
        alert: 'Alert',
        warning: 'Warning',
        activity: 'Activity',
        info: 'Info',
      },
    },
  },
} as const

export function getSecurityContent(locale: AppLocale) {
  return SECURITY_CONTENT[locale]
}
