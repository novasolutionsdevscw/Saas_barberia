<?php

namespace App\Services;

use App\Models\Barberia;
use Carbon\Carbon;

class SubscriptionService
{
    public const GRACE_DAYS = 7;

    public const SUBSCRIPTION_DAYS = 30;

    /**
     * Evalúa y actualiza el estado del sistema según fecha de vencimiento.
     */
    public function evaluateAndSync(Barberia $barberia): Barberia
    {
        if ($barberia->estado_sistema === Barberia::ESTADO_BLOQUEADO && ! $barberia->activa) {
            return $barberia;
        }

        if (! $barberia->fecha_vencimiento) {
            return $barberia;
        }

        $vencimiento = Carbon::parse($barberia->fecha_vencimiento)->startOfDay();
        $hoy = Carbon::today();

        if ($hoy->lte($vencimiento)) {
            if ($barberia->estado_sistema !== Barberia::ESTADO_ACTIVO && $barberia->estado_pago === Barberia::ESTADO_PAGO_PAGADO) {
                $barberia->update(['estado_sistema' => Barberia::ESTADO_ACTIVO]);
            }

            return $barberia->fresh();
        }

        $diasVencido = $hoy->diffInDays($vencimiento);

        if ($diasVencido <= self::GRACE_DAYS) {
            if ($barberia->estado_sistema !== Barberia::ESTADO_EN_GRACIA) {
                $barberia->update(['estado_sistema' => Barberia::ESTADO_EN_GRACIA]);
            }
        } elseif ($barberia->estado_sistema !== Barberia::ESTADO_BLOQUEADO) {
            $barberia->update([
                'estado_sistema' => Barberia::ESTADO_BLOQUEADO,
                'activa' => false,
            ]);
        }

        return $barberia->fresh();
    }

    public function diasRelativos(?string $fechaVencimiento): ?int
    {
        if (! $fechaVencimiento) {
            return null;
        }

        $vencimiento = Carbon::parse($fechaVencimiento)->startOfDay();

        return (int) Carbon::today()->diffInDays($vencimiento, false);
    }

    public function etiquetaDias(?int $dias): ?string
    {
        if ($dias === null) {
            return null;
        }

        if ($dias > 0) {
            return "Vence en {$dias} día".($dias === 1 ? '' : 's');
        }

        if ($dias === 0) {
            return 'Vence hoy';
        }

        $abs = abs($dias);

        return "Vencido hace {$abs} día".($abs === 1 ? '' : 's');
    }

    public function isBlocked(Barberia $barberia): bool
    {
        $barberia = $this->evaluateAndSync($barberia);

        return $barberia->estado_sistema === Barberia::ESTADO_BLOQUEADO;
    }

    public function isGrace(Barberia $barberia): bool
    {
        $barberia = $this->evaluateAndSync($barberia);

        return $barberia->estado_sistema === Barberia::ESTADO_EN_GRACIA;
    }

    public function subscriptionPayload(Barberia $barberia): array
    {
        $barberia = $this->evaluateAndSync($barberia);
        $dias = $this->diasRelativos($barberia->fecha_vencimiento?->format('Y-m-d'));

        return [
            'estado_sistema' => $barberia->estado_sistema,
            'estado_pago' => $barberia->estado_pago,
            'fecha_vencimiento' => $barberia->fecha_vencimiento?->format('Y-m-d'),
            'dias_restantes' => $dias,
            'etiqueta_dias' => $this->etiquetaDias($dias),
            'bloqueado' => $barberia->estado_sistema === Barberia::ESTADO_BLOQUEADO,
            'en_gracia' => $barberia->estado_sistema === Barberia::ESTADO_EN_GRACIA,
        ];
    }
}
