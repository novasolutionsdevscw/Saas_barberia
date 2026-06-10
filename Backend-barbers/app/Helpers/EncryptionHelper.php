<?php

namespace App\Helpers;

/**
 * Sistema de hash personalizado (no bcrypt).
 * SHA-256 + salt manual + base64 + ofuscación de strings. No reversible.
 */
class EncryptionHelper
{
    private const SALT_LENGTH = 16;

    private const DELIMITER = '$';

    private const MIX_SEPARATOR = '::BN::';

    public static function hash(string $plainPassword): string
    {
        $salt = bin2hex(random_bytes(self::SALT_LENGTH));
        $digest = self::computeDigest($plainPassword, $salt);
        $encoded = base64_encode($digest);
        $obfuscated = self::obfuscate($encoded, $salt);

        return $salt . self::DELIMITER . $obfuscated;
    }

    public static function verify(string $plainPassword, string $storedHash): bool
    {
        $parts = explode(self::DELIMITER, $storedHash, 2);

        if (count($parts) !== 2) {
            return false;
        }

        [$salt, $obfuscated] = $parts;
        $encoded = self::deobfuscate($obfuscated, $salt);

        if ($encoded === '') {
            return false;
        }

        $expected = self::computeDigest($plainPassword, $salt);
        $actual = base64_decode($encoded, true);

        if ($actual === false) {
            return false;
        }

        return hash_equals($expected, $actual);
    }

    private static function computeDigest(string $password, string $salt): string
    {
        $peppered = $salt . '|' . $password . '|' . config('app.key', 'barbers-nova');

        return hash('sha256', $peppered, true);
    }

    /**
     * Ofusca el hash: invierte cadena + mezcla con salt + base64.
     */
    private static function obfuscate(string $encoded, string $salt): string
    {
        $mixed = strrev($salt . self::MIX_SEPARATOR . $encoded);

        return base64_encode($mixed);
    }

    private static function deobfuscate(string $obfuscated, string $salt): string
    {
        $decoded = base64_decode($obfuscated, true);

        if ($decoded === false) {
            return '';
        }

        $payload = strrev($decoded);
        $prefix = $salt . self::MIX_SEPARATOR;

        if (! str_starts_with($payload, $prefix)) {
            return '';
        }

        return substr($payload, strlen($prefix));
    }
}
