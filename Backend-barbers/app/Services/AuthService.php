<?php

namespace App\Services;

use App\Helpers\EncryptionHelper;
use App\Helpers\JwtHelper;
use App\Helpers\SlugHelper;
use App\Models\Barberia;
use App\Models\User;
use App\Repositories\BarberiaRepository;
use App\Repositories\UserRepository;
use App\Services\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AuthService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly BarberiaRepository $barberiaRepository,
    ) {}

    /**
     * Crea barbería + administrador (solo desde panel Matriz).
     *
     * @return array{user: User, barberia: Barberia}
     */
    public function crearBarberiaConAdmin(
        string $name,
        string $email,
        string $password,
        ?string $nombreBarberia = null,
    ): array {
        if ($this->userRepository->emailExists($email)) {
            throw new InvalidArgumentException('El correo electrónico ya está registrado.');
        }

        return DB::transaction(function () use ($name, $email, $password, $nombreBarberia) {
            $nombre = $nombreBarberia ?: 'Barbería de ' . $name;

            $barberia = $this->barberiaRepository->create([
                'nombre' => $nombre,
                'slug' => SlugHelper::generateUnique($nombre),
                'email' => $email,
                'activa' => true,
                'estado_pago' => Barberia::ESTADO_PAGO_PENDIENTE,
                'estado_sistema' => Barberia::ESTADO_ACTIVO,
                'fecha_vencimiento' => Carbon::today()->addDays(SubscriptionService::SUBSCRIPTION_DAYS),
            ]);

            $user = $this->userRepository->create([
                'name' => $name,
                'email' => $email,
                'password' => EncryptionHelper::hash($password),
                'barberia_id' => $barberia->id,
                'rol' => User::ROL_ADMIN,
            ]);

            $user->load('barberia');

            return [
                'user' => $user,
                'barberia' => $barberia,
            ];
        });
    }

    /**
     * @return array{user: User, token: string}
     */
    public function login(string $email, string $password): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (! $user || ! EncryptionHelper::verify($password, $user->password)) {
            throw new InvalidArgumentException('Credenciales inválidas.');
        }

        if ($user->isSuperAdmin()) {
            $user->load('barberia');
            $token = $this->buildToken($user);

            return [
                'user' => $user,
                'token' => $token,
            ];
        }

        if (! $user->barberia_id) {
            throw new InvalidArgumentException('Usuario sin barbería asignada.');
        }

        $user->load('barberia');
        $token = $this->buildToken($user);

        return [
            'user' => $user,
            'token' => $token,
        ];
    }

    public function me(int $userId): ?User
    {
        $user = $this->userRepository->findById($userId);

        return $user?->load('barberia');
    }

    private function buildToken(User $user): string
    {
        return JwtHelper::encode([
            'sub' => $user->id,
            'barberia_id' => $user->barberia_id ?? 0,
            'rol' => $user->rol,
            'email' => $user->email,
            'name' => $user->name,
        ], (int) config('jwt.ttl_hours', 24));
    }
}
