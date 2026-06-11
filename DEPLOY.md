# Production Deployment (Docker + your existing `.env`)

Self-contained Docker stack: Laravel (php-fpm 8.4) + nginx + MariaDB + queue worker.
The containers read your **repo-root `.env`** directly. The database is **auto-imported**
from `u2304932_car_booking.sql` on the first start.

---

## 1. Server prerequisites (once)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER          # log out/in afterwards
```

## 2. Code, `.env`, and the SQL dump

Both `.env` and `u2304932_car_booking.sql` are **gitignored**, so they aren't in the clone —
put them in the project directory on the server:

```bash
git clone https://github.com/BillSharifzade/Auto-Booking-System.git
cd Auto-Booking-System
# .env and the SQL dump (copy from your machine if not already there):
scp .env                      user@server:$(pwd)/
scp u2304932_car_booking.sql  user@server:$(pwd)/
```

Make sure `.env` has the production values you want — at least:
`APP_URL` / `WEBAPP_URL` = your domain, and the `DB_*` credentials.
(Compose forces `DB_HOST=db` for you, so leave that as-is in `.env`.)

## 3. Build & start

```bash
docker compose up -d --build
```

First boot imports the SQL dump and runs migrations. The web server is bound to
**127.0.0.1:8090** (loopback only — front it with your TLS reverse proxy).

Check it:

```bash
docker compose ps
curl -I http://127.0.0.1:8090
```

## 4. TLS reverse proxy (host nginx)

```nginx
server {
    listen 80;
    server_name akhd.koinotinav.com;
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
sudo certbot --nginx -d akhd.koinotinav.com
```

The app trusts proxy headers (`bootstrap/app.php`), so it generates correct `https://`
URLs once `X-Forwarded-Proto` arrives.

## 5. Telegram webhook (if used)

```bash
TOKEN=$(grep ^TELEGRAM_BOT_TOKEN= .env | cut -d= -f2)
curl "https://api.telegram.org/bot$TOKEN/setWebhook" \
  --data-urlencode "url=https://akhd.koinotinav.com/telegram/webhook"
```

---

## Access

- Client app:  `https://akhd.koinotinav.com/`
- Admin panel: `https://akhd.koinotinav.com/admin`
- API:         `https://akhd.koinotinav.com/api/...`

## Day-to-day

```bash
docker compose up -d --build   # deploy after a git pull
docker compose ps              # status
docker compose logs -f app     # tail logs
docker compose restart app queue   # apply .env changes
docker compose down            # stop (keeps DB data)
docker compose down -v         # stop + WIPE the DB volume (re-imports the .sql)
```

## How the `.env` is wired

- `app` and `queue` load your repo-root **`.env`** (`env_file: .env`), with **`DB_HOST=db`**
  forced in compose (your `.env`'s `127.0.0.1` would point the container at itself).
- The `db` service reads `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` from the same `.env`
  via `${...}`, so app and database credentials always match.

## ⚠️ Data safety

- The `.sql` dump imports **only on a fresh DB volume**. Once live, don't run `down -v`
  unless you intend to wipe and re-seed.
- `DB_PASSWORD` takes effect only on the **first** start (when the volume is created).
  Changing it in `.env` later needs a manual `ALTER USER` inside the DB.
- Back up regularly:
  ```bash
  docker compose exec db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" u2304932_car_booking > backup-$(date +%F).sql
  ```
