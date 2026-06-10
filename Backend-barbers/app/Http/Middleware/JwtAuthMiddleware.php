<?php

namespace App\Http\Middleware;

use App\Helpers\JwtHelper;
use App\Models\User;
use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');

        if (! $header || ! str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Token no proporcionado.'], 401);
        }

        $token = substr($header, 7);

        try {
            $payload = JwtHelper::decode($token);
        } catch (ExpiredException) {
            return response()->json(['message' => 'Token expirado.'], 401);
        } catch (SignatureInvalidException) {
            return response()->json(['message' => 'Token inválido.'], 401);
        } catch (\Throwable) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        $request->attributes->set('jwt_payload', $payload);
        $request->attributes->set('user_id', (int) $payload->sub);
        $request->attributes->set('barberia_id', (int) $payload->barberia_id);
        $request->attributes->set('user_rol', $payload->rol ?? null);

        $user = User::find((int) $payload->sub);

        $request->attributes->set('user', $user);

        return $next($request);
    }
}
