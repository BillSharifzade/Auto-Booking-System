# syntax=docker/dockerfile:1

# ============================================================
# Stage 1 — build front-end assets (React admin + client) with Vite
# ============================================================
FROM node:20-alpine AS assets
WORKDIR /app

# Install JS deps using the lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy the sources needed for the Vite build
COPY vite.config.js tailwind.config.js postcss.config.js tsconfig.json ./
COPY resources ./resources

# Build with a relative API base so the bundles work on any host
ENV VITE_API_BASE_URL=""
RUN npm run build


# ============================================================
# Stage 2 — PHP runtime (php-fpm + nginx in one image)
# ============================================================
FROM php:8.4-fpm-alpine AS app

# System packages: nginx (served by the `web` service) + libs
RUN apk add --no-cache nginx bash

# PHP extensions required by Laravel 12 + this project
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions \
    pdo_mysql \
    mbstring \
    bcmath \
    zip \
    gd \
    intl \
    exif \
    pcntl \
    opcache

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps first (better layer caching). Scripts run later once code is present.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# Application source
COPY . .

# Built front-end assets from stage 1
COPY --from=assets /app/public/build ./public/build

# Container env file (DB points at the `db` service). Compose overrides secrets at runtime.
COPY docker/env.docker .env

# Finish composer autoload + discover packages (no DB needed)
RUN composer dump-autoload --optimize --no-dev \
 && php artisan package:discover --ansi || true \
 && php artisan storage:link || true

# Permissions for runtime-writable dirs
RUN chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

# nginx vhost (used by the `web` service)
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Entrypoint runs DB-dependent setup, then execs CMD (php-fpm)
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 9000
ENTRYPOINT ["entrypoint"]
CMD ["php-fpm", "-F"]
