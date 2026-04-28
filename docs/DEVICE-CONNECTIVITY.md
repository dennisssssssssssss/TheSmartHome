# Device Connectivity Strategy

This is the recommended integration strategy for the SmartHomeManager product.

## Recommended default architecture

Use a hybrid approach:

- `Matter` as the primary smart-home protocol for mainstream devices
- `Modbus` for solar, inverters, and electrical metering
- `MQTT` as a bridge layer for custom hardware and unsupported vendors
- `Bluetooth Low Energy` only for commissioning or close-range onboarding, not as the main control plane

## Why this is the best fit

### Matter

Best for:

- lights
- plugs
- thermostats
- blinds
- sensors
- future multi-vendor smart-home hardware

Strengths:

- cross-ecosystem interoperability
- strong momentum in the smart-home space
- fits the product goal of broad compatibility

### Modbus

Best for:

- solar inverters
- smart meters
- battery controllers
- electrical monitoring hardware

Strengths:

- common in industrial and energy equipment
- predictable for telemetry and register-based integrations
- a strong fit for power and measurement features

### MQTT bridge

Best for:

- ESP32 or Arduino gateways
- DIY hardware
- vendor APIs wrapped by your backend

Strengths:

- flexible internal integration layer
- good for adapters and gateways you control
- useful when a vendor does not speak Matter directly

### BLE

Best for:

- onboarding
- commissioning
- proximity-based setup

Not recommended as the main runtime control path because range, topology, and user experience become limiting quickly in a whole-home product.

## Transport recommendations by device family

- low-power sensors and future battery devices: `Matter over Thread`
- mains-powered smart-home devices: `Matter over Wi-Fi` or `Ethernet`
- cameras and high-bandwidth devices: `Wi-Fi` or `Ethernet`
- solar and energy hardware: `Modbus RTU over RS-485` or `Modbus TCP`
- custom gateways: `MQTT` over `Wi-Fi` or `Ethernet`

## Product rule of thumb

If the device is consumer smart-home hardware, prefer Matter first.

If the device is energy or electrical infrastructure, prefer Modbus first.

If the device is custom or unsupported, bridge it with MQTT through a gateway you control.
