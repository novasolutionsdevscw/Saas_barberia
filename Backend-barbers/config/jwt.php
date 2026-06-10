<?php

return [
    // Si JWT_SECRET está vacío en .env, usar APP_KEY (evita "Provided key is too short")
    // wilmer - 2026-05-27 deje asi pero para produccion dejamos en el env el jwt_secret
    
    'secret' => env('JWT_SECRET') ?: env('APP_KEY'),
    'ttl_hours' => (int) env('JWT_TTL_HOURS', 24),
];
