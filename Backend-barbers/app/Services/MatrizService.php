<?php

namespace App\Services;

use App\Models\Barberia;
use App\Models\PagoBarberia;
use App\Repositories\BarberiaRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class MatrizService
{
    public function __construct(
        private readonly BarberiaRepository $barberiaRepository,
        private readonly SubscriptionService $subscriptionService,
        private readonly AuthService $authService,
        private readonly FrontendUrlResolver $frontendUrl,
    ) {}

    public function dashboardStats(): array
    {
        $barberias = $this->barberiaRepository->allWithAdmin();
        $barberias->each(fn (Barberia $b) => $this->subscriptionService->evaluateAndSync($b));

        $ingresos = (float) PagoBarberia::query()->sum('monto');

        return [
            'total_barberias' => $barberias->count(),
            'activas' => $barberias->where('estado_sistema', Barberia::ESTADO_ACTIVO)->count(),
            'en_gracia' => $barberias->where('estado_sistema', Barberia::ESTADO_EN_GRACIA)->count(),
            'bloqueadas' => $barberias->where('estado_sistema', Barberia::ESTADO_BLOQUEADO)->count(),
            'ingresos_totales' => $ingresos,
            'pagos_registrados' => PagoBarberia::query()->count(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listBarberias(?string $estadoPago = null, ?string $estadoSistema = null): Collection
    {
        $barberias = $this->barberiaRepository->allWithAdmin($estadoPago, $estadoSistema);

        return $barberias->map(fn (Barberia $b) => $this->formatBarberia($b));
    }

    /**
     * @return array<string, mixed>
     */
    public function registrarBarberia(
        string $name,
        string $email,
        string $password,
        ?string $nombreBarberia = null,
    ): array {
        $result = $this->authService->crearBarberiaConAdmin($name, $email, $password, $nombreBarberia);

        return $this->formatBarberia($result['barberia']->load('adminPrincipal'));
    }

    public function registrarPago(int $barberiaId, ?string $registradoPor = null): array
    {
        $barberia = $this->findOrFail($barberiaId);

        $base = $barberia->fecha_vencimiento && Carbon::parse($barberia->fecha_vencimiento)->isFuture()
            ? Carbon::parse($barberia->fecha_vencimiento)
            : Carbon::today();

        $nuevaFecha = $base->copy()->addDays(SubscriptionService::SUBSCRIPTION_DAYS);

        $barberia->update([
            'estado_pago' => Barberia::ESTADO_PAGO_PAGADO,
            'estado_sistema' => Barberia::ESTADO_ACTIVO,
            'fecha_vencimiento' => $nuevaFecha,
            'activa' => true,
        ]);

        PagoBarberia::query()->create([
            'barberia_id' => $barberia->id,
            'monto' => config('matriz.monto_suscripcion', PagoBarberia::MONTO_DEFAULT),
            'fecha_pago' => Carbon::today(),
            'nueva_fecha_vencimiento' => $nuevaFecha,
            'registrado_por' => $registradoPor,
        ]);

        return $this->formatBarberia($barberia->fresh()->load('adminPrincipal'));
    }

    public function bloquear(int $barberiaId): array
    {
        $barberia = $this->findOrFail($barberiaId);
        $barberia->update([
            'estado_sistema' => Barberia::ESTADO_BLOQUEADO,
            'activa' => false,
        ]);

        return $this->formatBarberia($barberia->fresh()->load('adminPrincipal'));
    }

    public function activar(int $barberiaId): array
    {
        $barberia = $this->findOrFail($barberiaId);
        $barberia->update([
            'estado_sistema' => Barberia::ESTADO_ACTIVO,
            'activa' => true,
        ]);

        return $this->formatBarberia($barberia->fresh()->load('adminPrincipal'));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function listPagos(?int $barberiaId = null): Collection
    {
        $query = PagoBarberia::query()
            ->with('barberia')
            ->orderByDesc('fecha_pago')
            ->orderByDesc('id');

        if ($barberiaId) {
            $query->where('barberia_id', $barberiaId);
        }

        return $query->get()->map(fn (PagoBarberia $p) => [
            'id' => $p->id,
            'barberia_id' => $p->barberia_id,
            'barberia_nombre' => $p->barberia?->nombre,
            'monto' => (float) $p->monto,
            'fecha_pago' => $p->fecha_pago?->format('Y-m-d'),
            'nueva_fecha_vencimiento' => $p->nueva_fecha_vencimiento?->format('Y-m-d'),
            'registrado_por' => $p->registrado_por,
        ]);
    }

    public function resumenEstados(): array
    {
        $barberias = $this->barberiaRepository->allWithAdmin();
        $barberias->each(fn (Barberia $b) => $this->subscriptionService->evaluateAndSync($b));

        $porSistema = [
            Barberia::ESTADO_ACTIVO => [],
            Barberia::ESTADO_EN_GRACIA => [],
            Barberia::ESTADO_BLOQUEADO => [],
        ];

        $porPago = [
            Barberia::ESTADO_PAGO_PAGADO => [],
            Barberia::ESTADO_PAGO_PENDIENTE => [],
        ];

        foreach ($barberias as $barberia) {
            $formatted = $this->formatBarberia($barberia);
            $porSistema[$barberia->estado_sistema][] = $formatted;
            $porPago[$barberia->estado_pago][] = $formatted;
        }

        return [
            'resumen' => [
                'activo' => count($porSistema[Barberia::ESTADO_ACTIVO]),
                'en_gracia' => count($porSistema[Barberia::ESTADO_EN_GRACIA]),
                'bloqueado' => count($porSistema[Barberia::ESTADO_BLOQUEADO]),
                'pagado' => count($porPago[Barberia::ESTADO_PAGO_PAGADO]),
                'pendiente' => count($porPago[Barberia::ESTADO_PAGO_PENDIENTE]),
            ],
            'por_sistema' => $porSistema,
            'por_pago' => $porPago,
        ];
    }

    public function reportes(): array
    {
        $stats = $this->dashboardStats();
        $barberias = $this->listBarberias();
        $pagos = $this->listPagos();

        $pagosMes = PagoBarberia::query()
            ->whereMonth('fecha_pago', Carbon::now()->month)
            ->whereYear('fecha_pago', Carbon::now()->year)
            ->count();

        $ingresosMes = (float) PagoBarberia::query()
            ->whereMonth('fecha_pago', Carbon::now()->month)
            ->whereYear('fecha_pago', Carbon::now()->year)
            ->sum('monto');

        $proximasVencer = $barberias
            ->filter(fn ($b) => $b['dias_restantes'] !== null && $b['dias_restantes'] >= 0 && $b['dias_restantes'] <= 7)
            ->values();

        $vencidas = $barberias
            ->filter(fn ($b) => $b['dias_restantes'] !== null && $b['dias_restantes'] < 0)
            ->values();

        return [
            'stats' => $stats,
            'pagos_mes' => $pagosMes,
            'ingresos_mes' => $ingresosMes,
            'ultimos_pagos' => $pagos->take(10)->values(),
            'proximas_vencer' => $proximasVencer,
            'vencidas' => $vencidas,
            'barberias' => $barberias,
        ];
    }

    private function findOrFail(int $id): Barberia
    {
        $barberia = $this->barberiaRepository->findById($id);

        if (! $barberia) {
            throw new InvalidArgumentException('Barbería no encontrada.');
        }

        return $barberia;
    }

    private function formatBarberia(Barberia $barberia): array
    {
        $barberia = $this->subscriptionService->evaluateAndSync($barberia);
        $dias = $this->subscriptionService->diasRelativos($barberia->fecha_vencimiento?->format('Y-m-d'));
        $admin = $barberia->adminPrincipal;
        $frontendUrl = $this->frontendUrl->resolve();

        return [
            'id' => $barberia->id,
            'slug' => $barberia->slug,
            'nombre' => $barberia->nombre,
            'email' => $barberia->email,
            'telefono' => $barberia->telefono,
            'admin_nombre' => $admin?->name,
            'admin_email' => $admin?->email,
            'fecha_vencimiento' => $barberia->fecha_vencimiento?->format('Y-m-d'),
            'estado_pago' => $barberia->estado_pago,
            'estado_sistema' => $barberia->estado_sistema,
            'dias_restantes' => $dias,
            'etiqueta_dias' => $this->subscriptionService->etiquetaDias($dias),
            'activa' => $barberia->activa,
            'qr_url' => "{$frontendUrl}/b/{$barberia->slug}",
        ];
    }
}
