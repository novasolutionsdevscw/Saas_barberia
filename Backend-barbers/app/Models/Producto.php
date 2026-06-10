<?php

namespace App\Models;

use App\Helpers\AssetHelper;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Producto extends Model
{
    protected $table = 'productos';

    protected $fillable = [
        'barberia_id',
        'nombre',
        'descripcion',
        'stock',
        'precio',
        'imagen',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'precio' => 'decimal:2',
            'estado' => 'boolean',
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
