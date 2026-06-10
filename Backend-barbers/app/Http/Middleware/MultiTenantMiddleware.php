<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Repositories\UserRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Valida que el usuario solo acceda a datos de su barbería (barberia_id).
 */
class MultiTenantMiddleware
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->attributes->get('user_id');
        $barberiaId = $request->attributes->get('barberia_id');

        if (! $userId || ! $barberiaId) {
            return response()->json(['message' => 'Contexto de tenant inválido.'], 403);
        }

        $user = $this->userRepository->findById($userId);

        if (! $user || (int) $user->barberia_id !== (int) $barberiaId) {
            return response()->json(['message' => 'Acceso denegado a esta barbería.'], 403);
        }

        if ($user->rol === User::ROL_SUPER_ADMIN) {
            return response()->json(['message' => 'Super admin no tiene acceso al panel operativo.'], 403);
        }

        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
