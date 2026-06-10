<?php

namespace App\Helpers;

class AssetHelper
{
    /**
     * Ruta pública relativa servida por Laravel (/storage/...).
     */
    public static function toPublicPath(string $storedPath): string
    {
        $normalized = ltrim(str_replace('\\', '/', $storedPath), '/');

        return '/storage/'.$normalized;
    }

    /**
     * Normaliza URLs absolutas o relativas a /storage/... para que funcionen
     * desde el frontend (proxy Vite) y en producción.
     */
    public static function normalize(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        if (str_starts_with($url, '/storage/')) {
            return $url;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (is_string($path) && str_starts_with($path, '/storage/')) {
            return $path;
        }

        $trimmed = ltrim($url, '/');
        if (str_starts_with($trimmed, 'uploads/')) {
            return '/storage/'.$trimmed;
        }

        return $url;
    }
}
