<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoInventario extends Model
{
    protected $table = 'movimientos_inventario';

    protected $fillable = [
        'barberia_id',
        'producto_id',
        'tipo',
        'cantidad',
        'descripcion',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'integer',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function barberia(): BelongsTo
    {
        return $this->belongsTo(Barberia::class);
    }
}
