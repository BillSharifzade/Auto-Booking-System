# Running Car Booking with Docker

Self-contained stack: Laravel app (php-fpm 8.4) + nginx + MariaDB + queue worker, with an optional ngrok tunnel for the Telegram bot / Mini App.

## Quick start

```bash
docker compose up -d --build
```

- Admin panel:  http://localhost:8090/admin
- Client app:   http://localhost:8090/
- API:          http://localhost:8090/api/...
- DB (host):    127.0.0.1:3307  (user `u2304932_car_booking` / pass `nX7tT5rN0gdD2oQ6`, root `root`)

The database is **auto-imported** from `u2304932_car_booking.sql` the first time the `db`
volume is created. To start from a clean DB, run `docker compose down -v` first.

## Services

| Service | What it is | Port |
|---------|------------|------|
| `web`   | nginx, serves `public/`, proxies PHP to `app` | host **8090** → 80 |
| `app`   | php-fpm; entrypoint waits for DB, runs `migrate --force` | internal 9000 |
| `queue` | `php artisan queue:work` | — |
| `db`    | MariaDB 11 (data in `dbdata` volume) | host **3307** → 3306 |
| `ngrok` | public tunnel (profile `tunnel`) | inspector 4040 |

## Telegram bot / Mini App (public URL)

```bash
NGROK_AUTHTOKEN=<your_token> docker compose --profile tunnel up -d
PUB=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
echo "$PUB"
```

Then point your bot's webhook at it (use a TEST bot token, not production):

```bash
TOKEN=<your_test_bot_token>
# set the token for the app: edit docker/env.docker (TELEGRAM_BOT_TOKEN=...) and `docker compose up -d app`
curl "https://api.telegram.org/bot$TOKEN/setWebhook" --data-urlencode "url=$PUB/telegram/webhook"
```

Also set `WEBAPP_URL` in `docker/env.docker` to `$PUB` and recreate the app:
`docker compose up -d app` (or `down`/`up`). The ngrok free URL changes on every restart.

## Config

Container env lives in `docker/env.docker` (DB points at the `db` service; secrets like
`TELEGRAM_BOT_TOKEN` are blank by default). The repo-root `.env` is **not** used by the
containers. Front-end bundles are built with `VITE_API_BASE_URL=""` so they call relative
`/api` and work on any host (localhost or ngrok).

## Common commands

```bash
docker compose logs -f app          # tail app logs
docker compose exec app php artisan tinker
docker compose exec app php artisan migrate
docker compose down                 # stop (keep data)
docker compose down -v              # stop + wipe DB volume
docker compose up -d --build        # rebuild after code changes
```

> Note: PHP **8.4+** is required (composer.lock pins Symfony 8). Host ports 8000/8080 are
> assumed taken by another project, hence 8090.
