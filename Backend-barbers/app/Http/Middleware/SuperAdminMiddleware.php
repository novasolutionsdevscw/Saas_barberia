<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Repositories\UserRepository;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->attributes->get('user_id');

        if (! $userId) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        $user = $this->userRepository->findById($userId);

        if (! $user || $user->rol !== User::ROL_SUPER_ADMIN) {
            return response()->json([
                'message' => 'Acceso restringido. Solo disponible para super administrador.',
            ], 403);
        }

        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}
