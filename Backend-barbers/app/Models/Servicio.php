<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Servicio extends Model
{
    protected $table = 'servicios';

    protected $fillable = [
        'barberia_id',
        'nombre',
        'precio',
        'duracion',
        'estado',
    ];


    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }

    protected static function booted(): void
    {
        static::creating(function ($servicio) {
            $servicio->uuid = (string) Str::uuid();
        });
    }
}
