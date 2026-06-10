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
        'confirmado_at',
        'validado_at',
    ];

    protected $casts = [
        'fecha'         => 'date:Y-m-d',
        'precio'        => 'decimal:2',
        'confirmado_at' => 'datetime',
        'validado_at'   => 'datetime',
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
        return $query->whereIn('estado', ['pendiente', 'confirmado']);
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