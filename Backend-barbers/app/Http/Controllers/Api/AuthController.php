<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthService;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
        private readonly SubscriptionService $subscriptionService,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        try {
            $result = $this->authService->login(
                $validated['email'],
                $validated['password'],
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 401);
        }

        return response()->json([
            'message' => 'Inicio de sesión exitoso.',
            'token' => $result['token'],
            'user' => $this->formatUser($result['user']),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');
        $user = $this->authService->me($userId);

        if (! $user) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $payload = [
            'user' => $this->formatUser($user),
        ];

        if ($user->rol !== User::ROL_SUPER_ADMIN && $user->barberia) {
            $payload['subscription'] = $this->subscriptionService->subscriptionPayload($user->barberia);
        }

        return response()->json($payload);
    }

    private function formatUser(User $user): array
    {
        $barberia = $user->barberia;
        $barbero = $user->isBarbero() ? $user->barbero : null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'rol' => $user->rol,
            'barberia_id' => $user->barberia_id,
            'barbero' => $barbero ? [
                'id' => $barbero->id,
                'uuid' => $barbero->uuid,
                'nombre' => $barbero->nombre,
                'foto' => $barbero->foto,
                'especialidad' => $barbero->especialidad,
                'telefono' => $barbero->telefono,
            ] : null,
            'barberia' => $barberia ? [
                'id' => $barberia->id,
                'nombre' => $barberia->nombre,
                'logo' => $barberia->logo,
                'telefono' => $barberia->telefono,
                'email' => $barberia->email,
                'direccion' => $barberia->direccion,
                'estado_pago' => $barberia->estado_pago,
                'estado_sistema' => $barberia->estado_sistema,
                'fecha_vencimiento' => $barberia->fecha_vencimiento?->format('Y-m-d'),
            ] : null,
        ];
    }
}
