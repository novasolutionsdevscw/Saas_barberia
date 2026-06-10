<?php

namespace App\Models;

use App\Helpers\AssetHelper;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Barbero extends Model
{
    protected $table = 'barberos';

    protected $fillable = [
        'barberia_id',
        'user_id',
        'uuid',
        'nombre',
        'foto',
        'especialidad',
        'telefono',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => 'boolean',
        ];
    }

    protected function foto(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => AssetHelper::normalize($value),
        );
    }

    protected static function booted(): void
    {
        static::creating(function (Barbero $barbero) {
            if (empty($barbero->uuid)) {
                $barbero->uuid = (string) Str::uuid();
            }
        });

        static::retrieved(function (Barbero $barbero) {
            if (empty($barbero->uuid)) {
                $barbero->forceFill(['uuid' => (string) Str::uuid()]);
                $barbero->saveQuietly();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }
    
    public function horarios()
    {
        return $this->hasMany(HorarioBarbero::class);
    }

    public function bloqueos()
    {
        return $this->hasMany(BloqueoBarbero::class);
    }
}
