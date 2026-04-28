import type { AppLocale } from '@/lib/preferences'

const SETTINGS_CONTENT = {
  ro: {
    page: {
      eyebrow: 'SETĂRI',
      title: 'Control fin pentru aplicație și cont.',
    },
    sections: {
      general: 'General',
      account: 'Cont',
      system: 'Sistem',
    },
    general: {
      theme: 'Temă închisă',
      themeDescription: 'Comută rapid între tema închisă și tema deschisă.',
      language: 'Limba interfeței',
      languageDescription: 'Alege limba pentru site și aplicație.',
      notifications: 'Notificări',
      notificationsDescription: 'Preferință locală pentru acest browser.',
      autoLock: 'Auto-Lock',
      autoLockDescription: 'Creează o automatizare zilnică la 22:00 pentru fiecare încuietoare.',
      romanian: 'Română',
      english: 'English',
    },
    account: {
      username: 'Utilizator',
      changePassword: 'Schimbă parola',
      currentPassword: 'Parola actuală',
      newPassword: 'Parola nouă',
      confirmPassword: 'Confirmă parola',
    },
    system: {
      version: 'Versiune',
      resetDescription:
        'Această acțiune șterge doar preferințele salvate în browser și te deconectează. Nu șterge dispozitivele sau datele din baza de date.',
      resetLocalData: 'Resetează datele locale',
      resetConfirmation:
        'Ești sigur? Vei fi deconectat, iar datele locale salvate în acest browser vor fi șterse.',
    },
    passwordDialog: {
      title: 'Schimbă parola',
      cancel: 'Anulează',
      save: 'Salvează',
      saving: 'Se salvează...',
    },
    notifications: {
      completePasswordFields: 'Completează toate câmpurile pentru parolă',
      passwordMismatch: 'Parolele nu coincid',
      passwordTooShort: 'Parola nouă trebuie să aibă cel puțin 8 caractere',
      passwordChanged: 'Parola a fost schimbată cu succes',
      passwordChangeFailed: 'Nu am putut schimba parola',
      autoLockNeedsDevice: 'Adaugă cel puțin o încuietoare inteligentă înainte să activezi auto-lock',
      autoLockEnabled: 'Auto-lock a fost activat pentru toate încuietorile la 22:00',
      autoLockDisabled: 'Auto-lock a fost dezactivat',
      autoLockUpdateFailed: 'Nu am putut actualiza auto-lock',
    },
  },
  en: {
    page: {
      eyebrow: 'SETTINGS',
      title: 'Fine control for the app and your account.',
    },
    sections: {
      general: 'General',
      account: 'Account',
      system: 'System',
    },
    general: {
      theme: 'Dark mode',
      themeDescription: 'Quickly switch between dark and light themes.',
      language: 'Interface language',
      languageDescription: 'Choose the language for the site and app.',
      notifications: 'Notifications',
      notificationsDescription: 'Local preference for this browser.',
      autoLock: 'Auto-Lock',
      autoLockDescription: 'Creates a daily 22:00 automation for every lock.',
      romanian: 'Romanian',
      english: 'English',
    },
    account: {
      username: 'Username',
      changePassword: 'Change password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
    },
    system: {
      version: 'Version',
      resetDescription:
        'This action only clears browser-stored preferences and signs you out. It does not delete devices or database data.',
      resetLocalData: 'Reset local data',
      resetConfirmation:
        'Are you sure? You will be signed out and the browser-stored local data will be cleared.',
    },
    passwordDialog: {
      title: 'Change password',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
    },
    notifications: {
      completePasswordFields: 'Complete all password fields',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'New password must contain at least 8 characters',
      passwordChanged: 'Password changed successfully',
      passwordChangeFailed: 'Could not change the password',
      autoLockNeedsDevice: 'Add at least one smart lock before enabling auto-lock',
      autoLockEnabled: 'Auto-lock was enabled for all locks at 22:00',
      autoLockDisabled: 'Auto-lock was disabled',
      autoLockUpdateFailed: 'Could not update auto-lock',
    },
  },
} as const

export function getSettingsContent(locale: AppLocale) {
  return SETTINGS_CONTENT[locale]
}
