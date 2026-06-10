<?php

namespace App\Http\Middleware;

use App\Models\Barberia;
use Closure;
use Illuminate\Http\Request;

class ResolveBarberiaByApiKey
{
    public function handle(Request $request, Closure $next)
    {
        $apiKey = $request->header('x-api-key') ?? $request->query('api_key');

        if (! $apiKey) {
            return response()->json(['message' => 'API Key requerida.'], 400);
        }

        $barberia = Barberia::where('api_key', $apiKey)
            ->where('activa', true)
            ->first();

        if (! $barberia) {
            return response()->json(['message' => 'Barbería no encontrada o inactiva.'], 401);
        }

        $request->attributes->set('barberia', $barberia); // igual que haces con 'user'

        return $next($request);
    }
}