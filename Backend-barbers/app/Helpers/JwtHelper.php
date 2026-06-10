<?php

namespace App\Helpers;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use stdClass;

class JwtHelper
{
    public static function encode(array $payload, int $ttlHours = 24): string
    {
        $now = time();
        $claims = array_merge($payload, [
            'iat' => $now,
            'exp' => $now + ($ttlHours * 3600),
        ]);

        return JWT::encode($claims, self::secret(), 'HS256');
    }

    public static function decode(string $token): stdClass
    {
        return JWT::decode($token, new Key(self::secret(), 'HS256'));
    }

    private static function secret(): string
    {
        $secret = (string) (config('jwt.secret') ?: config('app.key'));

        if (str_starts_with($secret, 'base64:')) {
            $decoded = base64_decode(substr($secret, 7), true);
            if ($decoded !== false && $decoded !== '') {
                $secret = $decoded;
            }
        }

        if (strlen($secret) < 32) {
            throw new \RuntimeException(
                'JWT_SECRET o APP_KEY demasiado cortos. Ejecuta: php artisan key:generate'
            );
        }

        return $secret;
    }
}
