<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    public const ROL_ADMIN = 'admin_barberia';

    public const ROL_BARBERO = 'barbero';

    public const ROL_SUPER_ADMIN = 'super_admin';

    protected $fillable = [
        'name',
        'email',
        'password',
        'barberia_id',
        'rol',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class, 'barberia_id');
    }

    public function isAdminBarberia(): bool
    {
        return $this->rol === self::ROL_ADMIN;
    }

    public function barbero(): HasOne
    {
        return $this->hasOne(Barbero::class);
    }

    public function isBarbero(): bool
    {
        return $this->rol === self::ROL_BARBERO;
    }

    public function isSuperAdmin(): bool
    {
        return $this->rol === self::ROL_SUPER_ADMIN;
    }
}
