<?php

namespace App\Models;

use App\Helpers\AssetHelper;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GaleriaCorte extends Model
{
    public const MAX_POR_BARBERIA = 10;

    protected $table = 'galeria_cortes';

    protected $fillable = [
        'barberia_id',
        'titulo',
        'imagen',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'orden' => 'integer',
        ];
    }

    protected function imagen(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => AssetHelper::normalize($value),
        );
    }

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }
}
