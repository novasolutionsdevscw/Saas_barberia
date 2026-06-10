<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $fillable = [
        'barberia_id',
        'user_id',
        'nombre',
        'telefono',
        'email',
        'registrado',
    ];

    protected function casts(): array
    {
        return [
            'registrado' => 'boolean',
        ];
    }

    // ─── Relaciones ───────────────────────────

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function turnos(): HasMany
    {
        return $this->hasMany(Turno::class);
    }

    // ─── Helpers ──────────────────────────────

    /**
     * Indica si el cliente tiene cuenta registrada.
     */
    public function tieneCuenta(): bool
    {
        return ! is_null($this->user_id);
    }
}