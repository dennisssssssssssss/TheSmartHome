# LAN Access

You can access the development build from another PC on the same network.

## What changed

The development launch profiles now bind HTTP traffic to `0.0.0.0:5110`, so the app listens on all local network interfaces instead of only `localhost`.

## How to use it

1. Start the app from Visual Studio or `dotnet run`.
2. On the host machine, run:

```powershell
.\scripts\show-access-links.ps1
```

3. Open one of the printed `http://<your-ip>:5110` URLs from the second PC.

## Notes

- use the HTTP URL for LAN testing; the local HTTPS development certificate is usually trusted only on the host machine
- both computers must be on the same network
- if Windows Firewall prompts you, allow access for the app on private networks
- if you use the built-in frontend served by ASP.NET Core, no extra Vite configuration is required

## Quick example

If the host machine prints:

```text
http://192.168.1.24:5110
```

open that exact URL from the second PC.
