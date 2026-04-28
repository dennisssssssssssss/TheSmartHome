# Product Roadmap

This document keeps the long-term product direction visible while the codebase evolves incrementally.

## Product goal

Build a smart home platform that is:

- easy to understand for non-technical users
- usable from phone, tablet, laptop, and desktop
- extensible across comfort, automation, energy, and later security
- capable of integrating real devices instead of staying a demo-only application

## Product phases

### Phase 1: Core home control

- rooms-first organization
- device dashboard and onboarding
- scenes such as Home, Away, Night, Vacation
- device grouping and quick actions
- stable auth, settings, notifications, and automations

### Phase 2: Real device connectivity

- protocol-aware device model
- integration adapters for simulated, Matter, Modbus, and MQTT bridge scenarios
- pairing/setup workflows for supported devices
- health status, last seen, manufacturer, model, and endpoint metadata

### Phase 3: Energy and solar

- energy meters and per-device consumption
- solar inverter and production tracking
- battery storage visibility
- cost estimates, savings insights, and historical charts
- automation based on energy price, production, and battery state

### Phase 4: Security reminder

Security is intentionally deferred for later because it deserves a more serious design pass.

Scope reserved for the future:

- smart locks
- gate and garage control
- window and door sensors
- alarm modes and sirens
- camera events and motion rules
- access roles, audit trails, and stronger hardening

### Phase 5: Product polish

- mobile-first UX improvements
- more natural copy and onboarding
- richer empty states and guided flows
- accessibility pass
- production monitoring and support tooling

## Architecture direction

- Keep the codebase and technical naming in English.
- Keep the UI free to be Romanian-first or bilingual.
- Prefer protocol adapters over one-off vendor logic in controllers.
- Treat energy and connectivity as core domains, not add-ons.
- Keep security isolated until the rest of the platform foundation is stable.

## Immediate next milestones

1. Add real integration metadata to devices and expose supported protocol options.
2. Implement the first non-simulated integration path.
3. Build a simple pairing/setup UI for admin users.
4. Add energy-specific entities for solar, meter, and battery telemetry.
