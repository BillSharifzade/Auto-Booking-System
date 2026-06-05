#!/bin/bash
set -e

cd /var/www/html

# Only the php-fpm (app) container runs the bootstrap steps.
if [ "${1}" = "php-fpm" ]; then
    echo "[entrypoint] Ensuring storage structure & permissions..."
    mkdir -p \
        storage/framework/cache \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache
    chown -R www-data:www-data storage bootstrap/cache || true

    echo "[entrypoint] Waiting for database ${DB_HOST:-db}:${DB_PORT:-3306}..."
    until php -r 'exit(@fsockopen(getenv("DB_HOST") ?: "db", (int)(getenv("DB_PORT") ?: 3306)) ? 0 : 1);' 2>/dev/null; do
        sleep 2
    done
    echo "[entrypoint] Database is up."

    # Generate an app key if none is configured.
    if ! grep -q '^APP_KEY=base64:' .env 2>/dev/null; then
        php artisan key:generate --force || true
    fi

    echo "[entrypoint] Running migrations..."
    php artisan migrate --force || true

    # Keep config dynamic (routes use closures, so we never route:cache).
    php artisan config:clear || true
    php artisan view:clear || true

    echo "[entrypoint] Bootstrap complete."
fi

exec "$@"
