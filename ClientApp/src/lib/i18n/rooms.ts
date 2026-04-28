import type { AppLocale } from '@/lib/preferences'
import type { Device } from '@/types'

const DEVICE_TYPE_LABELS = {
  ro: {
    bulb: 'Bec',
    thermostat: 'Termostat',
    tv: 'TV',
    ac: 'Aer conditionat',
    lock: 'Incuietoare',
    camera: 'Camera',
    motion: 'Senzor de miscare',
    plug: 'Priza inteligenta',
    speaker: 'Boxa',
    blinds: 'Jaluzele',
    door: 'Senzor usa',
  },
  en: {
    bulb: 'Bulb',
    thermostat: 'Thermostat',
    tv: 'TV',
    ac: 'Air conditioner',
    lock: 'Lock',
    camera: 'Camera',
    motion: 'Motion sensor',
    plug: 'Smart plug',
    speaker: 'Speaker',
    blinds: 'Blinds',
    door: 'Door sensor',
  },
} as const

const INTEGRATION_PROTOCOL_LABELS = {
  ro: {
    simulated: 'Simulat',
    matter: 'Matter',
    modbus: 'Modbus',
    mqtt: 'MQTT Bridge',
  },
  en: {
    simulated: 'Simulated',
    matter: 'Matter',
    modbus: 'Modbus',
    mqtt: 'MQTT Bridge',
  },
} as const

const INTEGRATION_STATUS_LABELS = {
  ro: {
    ready: 'gata',
    beta: 'beta',
    planned: 'planificat',
  },
  en: {
    ready: 'ready',
    beta: 'beta',
    planned: 'planned',
  },
} as const

const TRANSPORT_LABELS = {
  ro: {
    wifi: 'Wi-Fi',
    thread: 'Thread',
    ethernet: 'Ethernet',
    rs485: 'RS-485',
    ble: 'Bluetooth LE',
  },
  en: {
    wifi: 'Wi-Fi',
    thread: 'Thread',
    ethernet: 'Ethernet',
    rs485: 'RS-485',
    ble: 'Bluetooth LE',
  },
} as const

const ROOMS_CONTENT = {
  ro: {
    page: {
      eyebrow: 'CAMERE',
      title: 'Casa ta, organizata natural pe camere.',
      description:
        'Pornesti de la spatiile reale ale locuintei, apoi asezi dispozitivele exact unde apartin. Acum poti decide si prin ce protocol le conectezi.',
      addRoom: 'Adauga camera',
      addDevice: 'Adauga dispozitiv',
      loading: 'Se incarca...',
    },
    stats: {
      rooms: 'Camere',
      devices: 'Dispozitive',
      activeDevices: 'Dispozitive active',
      securityDevices: 'Dispozitive de securitate',
    },
    errors: {
      load: 'Nu am putut incarca camerele si dispozitivele',
      createRoomFirst: 'Creeaza mai intai o camera',
      createRoomBeforeDevices: 'Creeaza prima camera, apoi adauga dispozitivele in ea.',
      roomNameRequired: 'Introdu numele camerei',
      roomCreate: 'Nu am putut crea camera',
      deviceNameRequired: 'Introdu numele dispozitivului',
      deviceRoomRequired: 'Alege camera pentru dispozitiv',
      deviceSave: 'Nu am putut salva dispozitivul',
      deviceDelete: 'Nu am putut sterge dispozitivul',
      deviceUpdate: 'Nu am putut actualiza dispozitivul',
      comfortUnavailable: 'Camera nu are dispozitive de confort',
      roomUpdate: 'Nu am putut actualiza camera',
      valueUpdate: 'Nu am putut actualiza valoarea dispozitivului',
      integrationLoad: 'Nu am putut incarca optiunile de integrare',
      matterPairingCodeRequired: 'Introdu codul de pairing Matter',
      matterPairing: 'Nu am putut face pairing-ul Matter',
      matterExternalIdRequired: 'Dispozitivele Matter au nevoie de pairing sau de un ID extern',
    },
    success: {
      roomCreated: 'Camera a fost adaugata',
      deviceCreated: 'Dispozitiv adaugat',
      deviceUpdated: 'Dispozitiv actualizat',
      deviceDeleted: 'Dispozitiv sters',
      roomComfortOn: 'Dispozitivele au fost pornite',
      roomComfortOff: 'Dispozitivele au fost oprite',
      matterPaired: 'Dispozitivul Matter a fost identificat',
    },
    empty: {
      noRooms: 'Nu ai camere create inca.',
      noSearchResults: 'Nu am gasit rezultate pentru cautarea ta.',
      noRoomsDescription: 'Incepe cu camerele, apoi adauga dispozitivele in contextul potrivit.',
      noSearchDescription: 'Incearca alt nume de camera sau alt tip de dispozitiv.',
      addFirstRoom: 'Adauga prima camera',
    },
    room: {
      eyebrow: 'CAMERA',
      devices: (count: number) => `${count} dispozitive`,
      active: (count: number) => `${count} active`,
      security: (count: number) => `${count} de securitate`,
      turnOnAmbient: 'Porneste ambientul',
      turnOffAmbient: 'Opreste ambientul',
      noConfiguration: 'Nicio configurare inca.',
      noConfigurationDescription: (roomName: string) => `Adauga primul dispozitiv in ${roomName} pentru a incepe configurarea.`,
    },
    fallback: {
      eyebrow: 'FALLBACK',
      title: 'Neatribuite.',
      description: 'Aceste dispozitive exista in sistem, dar nu mai sunt legate de o camera valida.',
      unassigned: 'Neatribuit',
    },
    dialogs: {
      editDevice: 'Editeaza dispozitivul',
      addDevice: 'Adauga dispozitiv',
      addRoom: 'Adauga camera',
      sections: {
        integration: 'Conectivitate',
        pairing: 'Pairing Matter',
      },
      labels: {
        name: 'Nume',
        type: 'Tip',
        room: 'Camera',
        value: 'Valoare',
        roomName: 'Nume camera',
        selectRoom: 'Selecteaza camera',
        poweredOn: 'Pornit',
        protocol: 'Protocol',
        transport: 'Transport',
        endpoint: 'Bridge URL / endpoint',
        externalId: 'ID extern dispozitiv',
        manufacturer: 'Producator',
        model: 'Model',
        pairingCode: 'Cod de pairing',
        integrationStatus: 'Status',
      },
      placeholders: {
        endpoint: 'http://localhost:9000/',
        pairingCode: 'MT:12345678901',
      },
      hints: {
        matter:
          'Matter este cea mai buna alegere pentru dispozitive smart-home moderne. Bluetooth LE este folosit in general la pairing, apoi controlul merge prin Wi-Fi, Thread sau Ethernet.',
        manual:
          'Pentru Modbus sau MQTT bridge poti completa manual endpoint-ul si identificatorul extern.',
      },
      actions: {
        cancel: 'Anuleaza',
        save: 'Salveaza',
        create: 'Creeaza',
        pairMatter: 'Pair Matter',
      },
    },
    actions: {
      edit: 'Editeaza',
      delete: 'Sterge',
      confirmDelete: (deviceName: string) => `Esti sigur ca vrei sa stergi ${deviceName}?`,
    },
  },
  en: {
    page: {
      eyebrow: 'ROOMS',
      title: 'Your home, organized naturally by room.',
      description:
        'Start with the real spaces of the home, then place each device exactly where it belongs. You can now also choose how each device connects.',
      addRoom: 'Add room',
      addDevice: 'Add device',
      loading: 'Loading...',
    },
    stats: {
      rooms: 'Rooms',
      devices: 'Devices',
      activeDevices: 'Active devices',
      securityDevices: 'Security devices',
    },
    errors: {
      load: 'Could not load rooms and devices',
      createRoomFirst: 'Create a room first',
      createRoomBeforeDevices: 'Create the first room, then add devices inside it.',
      roomNameRequired: 'Enter the room name',
      roomCreate: 'Could not create the room',
      deviceNameRequired: 'Enter the device name',
      deviceRoomRequired: 'Choose a room for the device',
      deviceSave: 'Could not save the device',
      deviceDelete: 'Could not delete the device',
      deviceUpdate: 'Could not update the device',
      comfortUnavailable: 'This room has no comfort devices',
      roomUpdate: 'Could not update the room',
      valueUpdate: 'Could not update the device value',
      integrationLoad: 'Could not load integration options',
      matterPairingCodeRequired: 'Enter the Matter pairing code',
      matterPairing: 'Could not pair the Matter device',
      matterExternalIdRequired: 'Matter devices need pairing or an external device ID',
    },
    success: {
      roomCreated: 'Room added successfully',
      deviceCreated: 'Device created successfully',
      deviceUpdated: 'Device updated successfully',
      deviceDeleted: 'Device deleted successfully',
      roomComfortOn: 'Comfort devices were turned on',
      roomComfortOff: 'Comfort devices were turned off',
      matterPaired: 'Matter device identified successfully',
    },
    empty: {
      noRooms: 'You do not have any rooms yet.',
      noSearchResults: 'No results matched your search.',
      noRoomsDescription: 'Start with rooms, then add devices in the right context.',
      noSearchDescription: 'Try another room name or device type.',
      addFirstRoom: 'Add the first room',
    },
    room: {
      eyebrow: 'ROOM',
      devices: (count: number) => `${count} devices`,
      active: (count: number) => `${count} active`,
      security: (count: number) => `${count} security`,
      turnOnAmbient: 'Turn on ambient',
      turnOffAmbient: 'Turn off ambient',
      noConfiguration: 'No configuration yet.',
      noConfigurationDescription: (roomName: string) => `Add the first device in ${roomName} to start configuring the room.`,
    },
    fallback: {
      eyebrow: 'FALLBACK',
      title: 'Unassigned.',
      description: 'These devices still exist in the system, but are no longer linked to a valid room.',
      unassigned: 'Unassigned',
    },
    dialogs: {
      editDevice: 'Edit device',
      addDevice: 'Add device',
      addRoom: 'Add room',
      sections: {
        integration: 'Connectivity',
        pairing: 'Matter pairing',
      },
      labels: {
        name: 'Name',
        type: 'Type',
        room: 'Room',
        value: 'Value',
        roomName: 'Room name',
        selectRoom: 'Select room',
        poweredOn: 'Powered on',
        protocol: 'Protocol',
        transport: 'Transport',
        endpoint: 'Bridge URL / endpoint',
        externalId: 'External device ID',
        manufacturer: 'Manufacturer',
        model: 'Model',
        pairingCode: 'Pairing code',
        integrationStatus: 'Status',
      },
      placeholders: {
        endpoint: 'http://localhost:9000/',
        pairingCode: 'MT:12345678901',
      },
      hints: {
        matter:
          'Matter is the best default for modern smart-home devices. Bluetooth LE is usually used only during pairing, then runtime control moves to Wi-Fi, Thread, or Ethernet.',
        manual:
          'For Modbus or MQTT bridge devices you can provide the endpoint and external identifier manually.',
      },
      actions: {
        cancel: 'Cancel',
        save: 'Save',
        create: 'Create',
        pairMatter: 'Pair Matter',
      },
    },
    actions: {
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: (deviceName: string) => `Are you sure you want to delete ${deviceName}?`,
    },
  },
} as const

export function getRoomsContent(locale: AppLocale) {
  return ROOMS_CONTENT[locale]
}

export function getRoomDeviceTypeLabel(type: Device['type'], locale: AppLocale) {
  return DEVICE_TYPE_LABELS[locale][type] ?? type
}

export function getIntegrationProtocolLabel(protocol: string | undefined, locale: AppLocale) {
  if (!protocol) return INTEGRATION_PROTOCOL_LABELS[locale].simulated
  return INTEGRATION_PROTOCOL_LABELS[locale][protocol as keyof typeof INTEGRATION_PROTOCOL_LABELS.en] ?? protocol
}

export function getIntegrationStatusLabel(status: string | undefined, locale: AppLocale) {
  if (!status) return ''
  return INTEGRATION_STATUS_LABELS[locale][status as keyof typeof INTEGRATION_STATUS_LABELS.en] ?? status
}

export function getTransportLabel(transport: string | undefined, locale: AppLocale) {
  if (!transport) return ''
  return TRANSPORT_LABELS[locale][transport as keyof typeof TRANSPORT_LABELS.en] ?? transport
}

export function getRoomDeviceStatusText(device: Device, locale: AppLocale) {
  if (device.type === 'lock') {
    return locale === 'ro' ? (device.status ? 'Incuiata' : 'Descuiata') : (device.status ? 'Locked' : 'Unlocked')
  }

  if (device.type === 'camera') {
    return device.status ? 'Online' : 'Offline'
  }

  if (device.type === 'motion' || device.type === 'door') {
    return locale === 'ro' ? (device.status ? 'Activ' : 'Inactiv') : (device.status ? 'Active' : 'Inactive')
  }

  if (['bulb', 'thermostat', 'ac', 'speaker', 'blinds'].includes(device.type)) {
    if (device.type === 'thermostat' || device.type === 'ac') {
      return `${device.value}C`
    }

    return `${device.value}%`
  }

  return locale === 'ro' ? (device.status ? 'Pornit' : 'Oprit') : (device.status ? 'On' : 'Off')
}
