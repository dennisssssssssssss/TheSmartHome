# Public Deployment

This is the correct path when you want the app reachable from anywhere, not only from `localhost` or your LAN.

## Recommended shape

- rent a VPS with a public IP
- point a domain or subdomain to that server
- run the ASP.NET app privately on `127.0.0.1:5000`
- place Nginx in front of it as the public reverse proxy
- terminate HTTPS on the proxy
- keep the app state outside the publish folder

This keeps Kestrel private and makes the public edge predictable.

## What this repository now supports

- production startup validation for `Jwt:Key`
- forwarded headers for reverse proxy hosting
- security response headers for browser hardening
- built-in request rate limiting with a stricter auth policy
- configurable runtime paths for logs and Data Protection keys
- optional self-contained publish via `scripts/publish-self-contained.ps1`
- sample files under `deploy/` for `systemd`, `nginx`, and environment variables

## Suggested server layout

- app files: `/opt/smarthomemanager`
- environment file: `/opt/smarthomemanager/.env`
- database file: `/var/lib/smarthomemanager/smarthome.db`
- Data Protection keys: `/var/lib/smarthomemanager/keys`
- logs: `/var/log/smarthomemanager`
- reverse proxy config: `/etc/nginx/sites-available/smarthomemanager`
- systemd service: `/etc/systemd/system/smarthomemanager.service`

## 1. Publish a Linux build

From your machine:

```powershell
.\scripts\publish-self-contained.ps1 -Runtime linux-x64 -Configuration Release
```

The output ends up in:

- [artifacts/publish/linux-x64](/C:/SmartHomeManager-master/SmartHomeManager/artifacts/publish/linux-x64)

## 2. Prepare the VPS

Create a dedicated user and the runtime directories:

```bash
sudo useradd --system --home /opt/smarthomemanager --shell /usr/sbin/nologin smarthome
sudo mkdir -p /opt/smarthomemanager
sudo mkdir -p /var/lib/smarthomemanager /var/log/smarthomemanager /var/www/certbot
sudo chown -R smarthome:smarthome /opt/smarthomemanager /var/lib/smarthomemanager /var/log/smarthomemanager
```

Install Nginx:

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

## 3. Copy the published app

Copy the contents of `artifacts/publish/linux-x64/` to:

- `/opt/smarthomemanager`

The app binary should end up as:

- `/opt/smarthomemanager/SmartHomeManager`

## 4. Create the production environment file

Copy:

- [production.env.example](/C:/SmartHomeManager-master/SmartHomeManager/deploy/env/production.env.example)

to:

- `/opt/smarthomemanager/.env`

Then set the real values.

At minimum, change these:

- `AllowedHosts=app.example.com`
- `Jwt__Key=...` with a long random secret
- `Cors__AllowedOrigins__0=https://app.example.com`
- `ReverseProxy__KnownProxies__0=127.0.0.1`

Keep these production-safe values:

- `Bootstrap__SeedDemoData=false`
- `Bootstrap__SeedDefaultAdmin=false`
- `Https__RedirectHttp=true`
- `Https__UseHsts=true`

If you already have an `admin` account in the database, change its password before going public.

## 5. Install the systemd service

Copy:

- [smarthomemanager.service](/C:/SmartHomeManager-master/SmartHomeManager/deploy/systemd/smarthomemanager.service)

to:

- `/etc/systemd/system/smarthomemanager.service`

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable smarthomemanager
sudo systemctl start smarthomemanager
sudo systemctl status smarthomemanager
```

The service file already hardens the process with:

- `NoNewPrivileges=true`
- `PrivateTmp=true`
- `ProtectSystem=strict`
- restricted writable paths for logs and state

## 6. Configure Nginx

Copy:

- [smarthomemanager.conf](/C:/SmartHomeManager-master/SmartHomeManager/deploy/nginx/smarthomemanager.conf)

to:

- `/etc/nginx/sites-available/smarthomemanager`

Replace:

- `app.example.com`

with your real domain.

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/smarthomemanager /etc/nginx/sites-enabled/smarthomemanager
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Add HTTPS

For Let's Encrypt on Ubuntu:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.example.com
```

After that, check:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Open the firewall

If you use UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

The goal is simple:

- expose only `80` and `443`
- keep Kestrel private on `127.0.0.1:5000`

## 9. Verify the app

Checks to run:

```bash
curl -I https://app.example.com
curl -I https://app.example.com/health
sudo systemctl status smarthomemanager
sudo journalctl -u smarthomemanager -n 100 --no-pager
```

## Before exposing it publicly

- set a real `Jwt__Key`
- disable demo/default bootstrap values unless you intentionally need them once
- change or remove the default `admin` account if it exists
- verify `AllowedHosts` matches the real domain
- trust only the reverse proxy IPs that actually forward traffic
- confirm the firewall only exposes `80` and `443`
- keep the database, keys, and logs outside the publish folder
- load test and tune the rate limits if you expect real traffic

## When SQLite is enough

SQLite is acceptable for:

- a single-server pilot
- a private rollout
- a light public deployment with low concurrency

Move to PostgreSQL before scaling if you expect:

- many concurrent users
- higher write volume
- multiple app instances
- stricter operational requirements

## Honest production note

After the current hardening, the app is in a good place for:

- serious demos
- private pilots
- a careful small public rollout

It is not yet at a fully mature internet-scale production level. Before that, I still recommend:

- PostgreSQL
- backup automation
- monitoring and alerts
- password reset / account recovery
- a deeper security pass on the future `Security` module
