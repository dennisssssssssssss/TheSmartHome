# API Quickstart

The backend runs behind the main application host:

- `http://localhost:5110`
- `https://localhost:7139`

Most endpoints require a JWT bearer token.

## Authenticate

`POST /api/Auth/login`

Request body:

```json
{
  "username": "admin",
  "password": "assist2026"
}
```

Use the returned token as:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Common endpoints

- `GET /api/Rooms`
  List rooms.
- `POST /api/Rooms`
  Create a room.
- `GET /api/Devices`
  List devices.
- `POST /api/Devices`
  Create a device.
- `POST /api/Devices/{id}/control`
  Toggle or update a device value.
- `GET /api/Automations`
  List automation rules.
- `POST /api/Automations`
  Create an automation.
- `GET /api/Notifications`
  List notifications.
- `POST /api/Auth/change-password`
  Change the password for the authenticated user.

## Useful local files

- `SmartHomeManager.http`
  Ready-to-run HTTP request samples.
- `ClientApp/src/lib/api.ts`
  Frontend API wrapper and response mapping.
- `Hubs/SmartHomeHub.cs`
  SignalR entry point for live updates.
