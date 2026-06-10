#!/bin/sh
php artisan storage:link --force 2>/dev/null || true
php-fpm -D
nginx -g "daemon off;"