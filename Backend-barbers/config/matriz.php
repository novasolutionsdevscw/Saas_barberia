<?php

return [
    'monto_suscripcion' => (float) env('MATRIZ_MONTO_SUSCRIPCION', 100),
    'frontend_url' => rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost:5173')), '/'),
];
