<?php

namespace App\Services;

use Illuminate\Http\Request;

class FrontendUrlResolver
{
    public function resolve(?Request $request = null): string
    {
        $request ??= request();
        $configured = rtrim((string) config('barbernova.frontend_url', ''), '/');

        if (app()->environment('production') && $configured !== '' && ! $this->isDevOnlyHost($configured)) {
            return $configured;
        }

        $frontendOrigin = $request?->header('X-Frontend-Origin');
        if (is_string($frontendOrigin) && $frontendOrigin !== '') {
            $normalized = rtrim(trim($frontendOrigin), '/');
            if (! $this->isDevOnlyHost($normalized)) {
                return $normalized;
            }
        }

        if ($configured !== '' && ! $this->isDevOnlyHost($configured)) {
            return $configured;
        }

        if ($request) {
            $origin = $request->header('Origin') ?? $request->header('Referer');

            if ($origin) {
                $parsed = parse_url($origin);

                if (isset($parsed['scheme'], $parsed['host'])) {
                    $port = isset($parsed['port']) ? ':'.$parsed['port'] : '';
                    $detected = "{$parsed['scheme']}://{$parsed['host']}{$port}";

                    if (! $this->isDevOnlyHost($detected)) {
                        return rtrim($detected, '/');
                    }
                }
            }
        }

        if (is_string($frontendOrigin) && $frontendOrigin !== '') {
            return rtrim(trim($frontendOrigin), '/');
        }

        if ($configured !== '') {
            return $configured;
        }

        $matrizFallback = rtrim((string) config('matriz.frontend_url', ''), '/');

        return $matrizFallback !== '' ? $matrizFallback : 'http://localhost:5173';
    }

    public function urlCita(string $uuid, ?Request $request = null): string
    {
        return $this->resolve($request).'/cita/'.$uuid;
    }

    public function urlCitaValidacionBarbero(string $uuid, ?Request $request = null): string
    {
        return $this->resolve($request).'/dashboard/validar-cita/'.$uuid;
    }

    private function isLocalhost(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST);

        return in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'], true);
    }

    private function isDevOnlyHost(string $url): bool
    {
        if ($this->isLocalhost($url)) {
            return true;
        }

        $host = parse_url($url, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return true;
        }

        if (! filter_var($host, FILTER_VALIDATE_IP)) {
            return false;
        }

        return filter_var(
            $host,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }
}
