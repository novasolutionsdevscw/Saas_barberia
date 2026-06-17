<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Turno extends Model
{
    protected $fillable = [
        'uuid',
        'barberia_id',
        'barbero_id',
        'servicio_id',
        'cliente_id',
        'fecha',
        'hora',
        'estado',
        'precio',
        'pago_monto_esperado',
        'comprobante_url',
        'comprobante_subido_at',
        'pago_motivo_rechazo',
        'hold_expires_at',
        'pago_validado_at',
        'confirmado_at',
        'validado_at',
    ];

    protected $casts = [
        'fecha'                 => 'date:Y-m-d',
        'precio'                => 'decimal:2',
        'pago_monto_esperado'   => 'decimal:2',
        'comprobante_subido_at' => 'datetime',
        'hold_expires_at'       => 'datetime',
        'pago_validado_at'      => 'datetime',
        'confirmado_at'         => 'datetime',
        'validado_at'           => 'datetime',
    ];

    // ─── Relaciones ───────────────────────────

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }

    public function barbero(): BelongsTo
    {
        return $this->belongsTo(Barbero::class);
    }

    public function servicio(): BelongsTo
    {
        return $this->belongsTo(Servicio::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    // ─── Scopes ───────────────────────────────

    public function scopeActivos($query)
    {
        return $query->whereIn('estado', ['pendiente_validacion', 'pendiente', 'confirmado']);
    }

    public function scopeBloqueanSlot($query)
    {
        return $query->where(function ($q) {
            $q->whereIn('estado', ['pendiente_validacion', 'pendiente', 'confirmado'])
                ->orWhere(function ($q2) {
                    $q2->where('estado', 'esperando_pago')
                        ->where(function ($q3) {
                            $q3->whereNull('hold_expires_at')
                                ->orWhere('hold_expires_at', '>', now());
                        });
                });
        });
    }

    public function scopeDeHoy($query)
    {
        return $query->whereDate('fecha', today());
    }

    public function scopePorFecha($query, string $fecha)
    {
        return $query->where('fecha', $fecha);
    }
}