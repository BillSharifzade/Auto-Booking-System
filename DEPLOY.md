# Production Deployment

Self-contained Docker stack: Laravel (php-fpm 8.4) + nginx + MariaDB + queue worker.
The database is **auto-imported** from `u2304932_car_booking.sql` on the first start.

---

## 1. Server prerequisites (once)

```bash
# Docker Engine + Compose plugin (Debian/Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER          # log out/in afterwards
```

## 2. Get the code + the SQL dump

```bash
git clone https://github.com/BillSharifzade/Auto-Booking-System.git
cd Auto-Booking-System
```

`u2304932_car_booking.sql` is **gitignored**, so copy it onto the server manually:

```bash
# from your machine
scp u2304932_car_booking.sql user@your-server:/path/to/Auto-Booking-System/
```

## 3. Configure secrets

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and set:

| Variable | What to put |
|----------|-------------|
| `APP_URL`, `WEBAPP_URL` | your real `https://your-domain.com` |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | strong, unique passwords (set **before** first start) |
| `TELEGRAM_BOT_TOKEN` | your bot token (or leave blank) |
| `APP_KEY` | generate it (next step) |

Generate the app key and paste it into `.env.production`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production \
  run --rm app php artisan key:generate --show
```

## 4. Build & start

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production \
  up -d --build
```

First boot imports the SQL dump, runs migrations, and starts all services.
The web server is bound to **127.0.0.1:8090** (loopback only — fronted by your proxy).

Check it:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:8090
```

## 5. TLS reverse proxy (host nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo certbot --nginx -d your-domain.com     # issues + installs the certificate
```

The app already trusts proxy headers (`bootstrap/app.php`), so it generates correct
`https://` URLs once `X-Forwarded-Proto` arrives.

## 6. Telegram webhook (if used)

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://your-domain.com/telegram/webhook"
```

---

## Access

- Client app:  `https://your-domain.com/`
- Admin panel: `https://your-domain.com/admin`
- API:         `https://your-domain.com/api/...`

## Day-to-day

> Tip: alias the long command —
> `alias dcp='docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production'`

```bash
dcp up -d --build      # deploy after a git pull
dcp ps                 # status
dcp logs -f app        # tail logs
dcp restart app queue  # apply env changes
dcp down               # stop (keeps DB data)
dcp down -v            # stop + WIPE the DB volume (re-imports the .sql next start)
```

## Updating the app

```bash
git pull
dcp up -d --build      # rebuilds image, runs migrations on boot
```

## ⚠️ Data safety

- The `.sql` dump is imported **only on a fresh DB volume**. Once live, **never** run
  `down -v` unless you intend to wipe and re-seed.
- `DB_PASSWORD` / `DB_ROOT_PASSWORD` take effect only on the **first** start (when the
  volume is created). Changing them later needs a manual `ALTER USER` inside the DB.
- Back up the database regularly:
  ```bash
  dcp exec db mariadb-dump -u root -p"$DB_ROOT_PASSWORD" u2304932_car_booking > backup-$(date +%F).sql
  ```
