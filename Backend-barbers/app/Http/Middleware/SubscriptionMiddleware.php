<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\SubscriptionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionMiddleware
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly SubscriptionService $subscriptionService,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->attributes->get('user_id');
        $user = $this->userRepository->findById($userId);

        if (! $user || $user->rol === User::ROL_SUPER_ADMIN) {
            return $next($request);
        }

        $barberia = $user->barberia;

        if (! $barberia) {
            return response()->json(['message' => 'Barbería no encontrada.'], 403);
        }

        if ($this->subscriptionService->isBlocked($barberia)) {
            return response()->json([
                'message' => 'Tu suscripción está vencida. Contacta al administrador.',
                'code' => 'subscription_blocked',
            ], 403);
        }

        if ($this->subscriptionService->isGrace($barberia)) {
            $request->attributes->set('subscription_warning', true);
            $request->attributes->set(
                'subscription_payload',
                $this->subscriptionService->subscriptionPayload($barberia),
            );
        }

        return $next($request);
    }
}
