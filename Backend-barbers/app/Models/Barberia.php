<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Barberia extends Model
{
    public const ESTADO_PAGO_PAGADO = 'pagado';

    public const ESTADO_PAGO_PENDIENTE = 'pendiente';

    public const ESTADO_ACTIVO = 'activo';

    public const ESTADO_EN_GRACIA = 'en_gracia';

    public const ESTADO_BLOQUEADO = 'bloqueado';

    protected $table = 'barberias';

    protected $fillable = [
        'nombre',
        'slug',
        'logo',
        'telefono',
        'email',
        'direccion',
        'activa',
        'estado_pago',
        'estado_sistema',
        'fecha_vencimiento',
    ];

    protected $hidden = [
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
            'fecha_vencimiento' => 'date',
        ];
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'barberia_id');
    }

    public function adminPrincipal(): HasOne
    {
        return $this->hasOne(User::class, 'barberia_id')
            ->where('rol', User::ROL_ADMIN);
    }

    protected static function booted(): void
    {
        static::creating(function ($barberia) {
            $barberia->api_key = 'pub_' . Str::random(32);
        });
    }
}
